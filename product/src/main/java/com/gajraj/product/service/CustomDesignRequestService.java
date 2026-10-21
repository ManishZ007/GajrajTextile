package com.gajraj.product.service;

import com.gajraj.product.dto.StudioMapping;
import com.gajraj.product.model.CustomDesignRequest;
import com.gajraj.product.repo.CustomDesignRequestRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import java.math.BigDecimal;
import java.time.Instant;

@Service
public class CustomDesignRequestService {
    private final CustomDesignRequestRepo requests;
    private final CustomerCustomizationService configurations;
    private final S3Service s3;
    private final ObjectMapper json=new ObjectMapper();
    public CustomDesignRequestService(CustomDesignRequestRepo requests,CustomerCustomizationService configurations,S3Service s3){
        this.requests=requests;this.configurations=configurations;this.s3=s3;
    }
    public record Submit(UUID requestId,UUID productId,String configurationVersion,Map<String,String> selections,
                         String contactName,String phone,String notes) {}
    public record Quote(BigDecimal amount,String notes,Long version) {}
    public record Selected(String id,String name,String hexCode,String assetKey) {}
    public record Snapshot(StudioMapping mapping,Map<String,Selected> selections,String categoryName) {}
    private static final Map<String,String> OPTION_LIST=Map.of(
        "bodyColor","bodyColors","borderColor","borderColors","padar","padar","border","border","butti","butti");
    private static String region(String name){return name.equals("bodyColor")?"body":name.equals("borderColor")?"border":name;}
    private static void fail(HttpStatus status,String message){throw new ResponseStatusException(status,message);}
    private static String text(String s){return s==null?"":s.trim();}

    @Transactional
    public Object submit(Submit body,String userId) {
        if(body==null || body.requestId()==null || body.productId()==null || body.selections()==null ||
            !OPTION_LIST.keySet().containsAll(body.selections().keySet()))
            fail(HttpStatus.BAD_REQUEST,"Invalid design request");
        if(text(body.contactName()).isEmpty() || text(body.contactName()).length()>100 ||
            !text(body.phone()).matches("[6-9][0-9]{9}") || text(body.notes()).length()>2000)
            fail(HttpStatus.BAD_REQUEST,"Provide a contact name, valid 10-digit Indian phone number, and notes up to 2000 characters");
        String submissionHash;
        try { submissionHash=HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(
            json.writeValueAsString(new Submit(body.requestId(),body.productId(),body.configurationVersion(),
                new TreeMap<>(body.selections()),text(body.contactName()),text(body.phone()),text(body.notes())))
            .getBytes(java.nio.charset.StandardCharsets.UTF_8))); }
        catch(java.security.NoSuchAlgorithmException e){throw new IllegalStateException(e);}
        var existing=requests.findById(body.requestId()).orElse(null);
        if(existing!=null){
            if(!existing.getUserId().equals(userId) || !existing.getSubmissionHash().equals(submissionHash))
                fail(HttpStatus.CONFLICT,"Request reference already used. Reload before submitting a different design.");
            return summary(existing);
        }
        var config=configurations.configuration(body.productId());
        if(!Objects.equals(config.get("configurationVersion"),body.configurationVersion()))
            fail(HttpStatus.CONFLICT,"The manager updated this design's options. Reload the designer and review your selections.");
        var mapping=(StudioMapping)config.get("mapping");
        var selected=new TreeMap<String,Selected>();
        for(var entry:body.selections().entrySet()) {
            String id=text(entry.getValue());
            if(id.isEmpty()) continue; // Original model appearance.
            var target=mapping.regions().get(region(entry.getKey()));
            if(target==null || target.targets().isEmpty()) fail(HttpStatus.BAD_REQUEST,"This design region is not customizable");
            @SuppressWarnings("unchecked")
            var options=(List<CategoryStudioService.Option>)config.get(OPTION_LIST.get(entry.getKey()));
            var option=options.stream().filter(o->o.id().toString().equals(id)).findFirst()
                .orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"A selected option does not belong to this category"));
            selected.put(entry.getKey(),new Selected(id,option.name(),option.hexCode(),option.assetKey()));
        }
        var entity=new CustomDesignRequest();
        entity.setId(body.requestId());entity.setUserId(userId);entity.setProductId(body.productId());
        entity.setProductName(config.get("productName").toString());entity.setContactName(text(body.contactName()));
        entity.setPhone(text(body.phone()));entity.setNotes(text(body.notes()));entity.setSubmissionHash(submissionHash);
        entity.setSnapshot(json.writeValueAsString(new Snapshot(mapping,selected,config.get("categoryName").toString())));
        return summary(requests.save(entity));
    }
    @Transactional(readOnly=true)
    public Object list(String userId,boolean staff,int page) {
        if(page<0) fail(HttpStatus.BAD_REQUEST,"Invalid page");
        var pageable=org.springframework.data.domain.PageRequest.of(page,20,org.springframework.data.domain.Sort.by("createdAt").descending());
        var result=staff?requests.findAll(pageable):requests.findByUserIdOrderByCreatedAtDesc(userId,pageable);
        return Map.of("items",result.getContent().stream().map(this::summary).toList(),"totalPages",result.getTotalPages(),"page",page);
    }
    private CustomDesignRequest owned(UUID id,String userId,boolean staff){
        var request=requests.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Design request not found"));
        if(!staff && !request.getUserId().equals(userId)) fail(HttpStatus.NOT_FOUND,"Design request not found");
        return request;
    }
    @Transactional(readOnly=true)
    public Object detail(UUID id,String userId,boolean staff) {
        var entity=owned(id,userId,staff);
        var result=summary(entity);
        var snapshot=json.readValue(entity.getSnapshot(),Snapshot.class);
        result.put("mapping",snapshot.mapping());result.put("categoryName",snapshot.categoryName());
        result.put("modelUrl",view(snapshot.mapping().modelKey()));
        var selections=new TreeMap<String,Object>();
        snapshot.selections().forEach((key,value)->{
            var option=new LinkedHashMap<String,Object>();
            option.put("id",value.id());option.put("name",value.name());option.put("hexCode",value.hexCode());
            option.put("url",view(value.assetKey()));selections.put(key,option);
        });
        result.put("selections",selections);
        return result;
    }
    @Transactional
    public Object quote(UUID id,Quote quote,String staffId) {
        if(quote==null || quote.amount()==null || quote.amount().signum()<=0 || quote.amount().scale()>2 ||
            quote.amount().compareTo(new BigDecimal("9999999999.99"))>0 || text(quote.notes()).length()>2000)
            fail(HttpStatus.BAD_REQUEST,"Enter a positive quote amount with at most two decimal places");
        var entity=owned(id,staffId,true);
        if(!Objects.equals(entity.getVersion(),quote.version())) fail(HttpStatus.CONFLICT,"This request changed. Reload before quoting.");
        entity.setQuoteAmount(quote.amount());entity.setQuoteNotes(text(quote.notes()));
        entity.setQuotedBy(staffId);entity.setQuotedAt(Instant.now());entity.setStatus("QUOTED");
        return summary(requests.saveAndFlush(entity));
    }
    private String view(String key){
        if(key==null || key.isBlank())return "";
        return key.startsWith("https://")?key:s3.generateViewUrl(key);
    }
    private Map<String,Object> summary(CustomDesignRequest r){
        var result=new LinkedHashMap<String,Object>();
        result.put("id",r.getId());result.put("reference","DES-"+r.getId().toString().substring(0,8).toUpperCase(Locale.ROOT));
        result.put("productId",r.getProductId());result.put("productName",r.getProductName());
        result.put("contactName",r.getContactName());result.put("phone",r.getPhone());result.put("notes",r.getNotes());
        result.put("status",r.getStatus());result.put("createdAt",r.getCreatedAt());result.put("version",r.getVersion());
        result.put("quoteAmount",r.getQuoteAmount());result.put("quoteNotes",r.getQuoteNotes());result.put("quotedAt",r.getQuotedAt());
        return result;
    }
}
