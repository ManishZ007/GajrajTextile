package com.gajraj.product.service;

import com.gajraj.product.dto.StudioMapping;
import com.gajraj.product.model.CategoryStudio;
import com.gajraj.product.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;
import java.util.*;

@Service
public class CategoryStudioService {
    private final ProductCategoriesRepo categories;
    private final CategoryStudioRepo studios;
    private final PadarRepo padars; private final BorderRepo borders; private final ButtiRepo buttis;
    private final BodyColorRepo bodies; private final BorderColorRepo colors;
    private final S3Service s3;
    private final ObjectMapper json=new ObjectMapper();
    public CategoryStudioService(ProductCategoriesRepo categories,CategoryStudioRepo studios,PadarRepo padars,BorderRepo borders,
        ButtiRepo buttis,BodyColorRepo bodies,BorderColorRepo colors,S3Service s3) {
        this.categories=categories;this.studios=studios;this.padars=padars;this.borders=borders;this.buttis=buttis;
        this.bodies=bodies;this.colors=colors;this.s3=s3;
    }
    public record Option(UUID id,String name,String url,String hexCode,String assetKey) {}
    @Transactional(readOnly=true)
    public Map<String,Object> get(UUID id) {
        var category=categories.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Category not found"));
        String key=Objects.toString(category.getBaseModelUrl(),"");
        var saved=studios.findById(id).orElse(null);
        boolean stale=saved!=null && !saved.getModelKey().equals(key);
        StudioMapping mapping=saved==null || stale ? new StudioMapping(key,Map.of()) : json.readValue(saved.getMappingJson(),StudioMapping.class);
        Map<String,Object> result=new LinkedHashMap<>();
        result.put("modelKey",key);result.put("modelUrl",view(key));result.put("mapping",mapping);result.put("staleMapping",stale);
        result.put("padar",padars.findByCategoryCategoryId(id).stream().map(p->new Option(p.getPadarId(),p.getPadarName(),view(p.getPadarUrl()),null,p.getPadarUrl())).toList());
        result.put("border",borders.findByCategoryCategoryId(id).stream().map(p->new Option(p.getBorderId(),p.getBorderName(),view(p.getBorderUrl()),null,p.getBorderUrl())).toList());
        result.put("butti",buttis.findByCategoryCategoryId(id).stream().map(p->new Option(p.getButtiId(),p.getButtiName(),view(p.getButtiUrl()),null,p.getButtiUrl())).toList());
        result.put("bodyColors",bodies.findByCategoryCategoryId(id).stream().map(p->new Option(p.getBodyColorId(),p.getColorName(),null,p.getHexCode(),null)).toList());
        result.put("borderColors",colors.findByCategoryCategoryId(id).stream().map(p->new Option(p.getBorderColorId(),p.getColorName(),null,p.getHexCode(),null)).toList());
        return result;
    }
    // No remote fetch: external HTTPS assets are loaded by the preview browser.
    private String view(String key) {
        if(key==null || key.isBlank()) return "";
        if(key.startsWith("https://")) return key;
        if(key.contains("://")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use an S3 key or HTTPS asset URL");
        return s3.generateViewUrl(key);
    }
    @Transactional
    public void save(UUID id,StudioMapping mapping) {
        if(mapping==null) bad();
        var category=categories.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Category not found"));
        if(category.getBaseModelUrl()==null || category.getBaseModelUrl().isBlank() || !category.getBaseModelUrl().equals(mapping.modelKey()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"The base model changed. Reload the preview before saving.");
        validate(mapping);
        CategoryStudio studio=new CategoryStudio();studio.setCategoryId(id);studio.setModelKey(mapping.modelKey());
        studio.setMappingJson(json.writeValueAsString(mapping));studios.save(studio);
    }
    public static void validate(StudioMapping mapping) {
        if(mapping==null || mapping.regions()==null || mapping.regions().size()>4) bad();
        Set<String> used=new HashSet<>();
        for(var entry:mapping.regions().entrySet()) {
            if(!Set.of("body","border","padar","butti").contains(entry.getKey())) bad();
            var region=entry.getValue();
            if(region==null || region.targets()==null || region.targets().size()>200) bad();
            for(String target:region.targets()) {
                if(target==null || target.length()>300 || !target.matches("[0-9]+(?:\\.[0-9]+)*:[0-9]+") || !used.add(target)) bad();
            }
            if(!range(region.repeatX(),0.01,100) || !range(region.repeatY(),0.01,100)
                || !range(region.offsetX(),-10,10) || !range(region.offsetY(),-10,10) || !range(region.rotation(),-360,360)) bad();
        }
    }
    private static boolean range(double v,double min,double max){return Double.isFinite(v) && v>=min && v<=max;}
    private static void bad(){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid region mapping, duplicate target, or texture transform.");}
}
