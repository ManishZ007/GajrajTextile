package com.gajraj.product.service;

import com.gajraj.product.dto.StudioMapping;
import com.gajraj.product.model.Products;
import com.gajraj.product.repo.ProductsRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

/** Customer reads use the manager's saved configuration; they cannot change mappings. */
@Service
public class CustomerCustomizationService {
    private final ProductsRepo products;
    private final CategoryStudioService studio;
    public CustomerCustomizationService(ProductsRepo products, CategoryStudioService studio) {
        this.products=products; this.studio=studio;
    }
    @Transactional(readOnly=true)
    public Object catalog(int page) {
        if(page<0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid page");
        var result=products.findAll((root,query,cb)->cb.and(
            cb.equal(cb.upper(root.get("status")),"ACTIVE"),
            cb.isTrue(root.get("category").get("customizable"))),
            org.springframework.data.domain.PageRequest.of(page,24,org.springframework.data.domain.Sort.by("name","productId")));
        return Map.of("items",result.getContent().stream().map(p->Map.of(
            "productId",p.getProductId(),"name",p.getName(),"categoryName",p.getCategory().getName())).toList(),
            "totalPages",result.getTotalPages(),"page",page);
    }
    @Transactional(readOnly=true)
    public Map<String,Object> configuration(UUID productId) {
        Products product=products.findById(productId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Product not found"));
        if(!"ACTIVE".equalsIgnoreCase(product.getStatus()) || !Boolean.TRUE.equals(product.getCategory().getCustomizable()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"This product is not available for customization");
        var data=new LinkedHashMap<>(studio.get(product.getCategory().getCategoryId()));
        var mapping=(StudioMapping)data.get("mapping");
        if(Boolean.TRUE.equals(data.get("staleMapping")) || mapping.modelKey().isBlank()
            || mapping.regions().values().stream().noneMatch(r->!r.targets().isEmpty()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"This category's 3D design is not ready yet. Please choose another product.");
        CategoryStudioService.validate(mapping);
        data.put("productId",productId);
        data.put("productName",product.getName());
        data.put("categoryName",product.getCategory().getName());
        // A reference price, not a custom quote or an amount supplied by the browser.
        data.put("basePrice",product.getBasePrice());
        Map<String,String> defaults=new LinkedHashMap<>();
        defaults.put("bodyColor",Objects.toString(product.getDefaultBodyColorId(),""));
        defaults.put("borderColor",Objects.toString(product.getDefaultBorderColorId(),""));
        defaults.put("padar",Objects.toString(product.getDefaultPadarId(),""));
        defaults.put("border",Objects.toString(product.getDefaultBorderId(),""));
        defaults.put("butti",Objects.toString(product.getDefaultButtiId(),""));
        data.put("defaults",defaults);
        data.put("configurationVersion",version(data));
        return data;
    }

    public static String version(Map<String,Object> data) {
        var fingerprint=new StringBuilder().append(data.get("mapping")).append(data.get("defaults"));
        for(String key:List.of("padar","border","butti","bodyColors","borderColors")) {
            @SuppressWarnings("unchecked")
            var options=(List<CategoryStudioService.Option>)data.get(key);
            options.stream().sorted(Comparator.comparing(o->o.id().toString())).forEach(o->
                fingerprint.append(o.id()).append(o.name()).append(o.assetKey()).append(o.hexCode()));
        }
        try {
            return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                .digest(fingerprint.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch(java.security.NoSuchAlgorithmException e) {throw new IllegalStateException(e);}
    }
}
