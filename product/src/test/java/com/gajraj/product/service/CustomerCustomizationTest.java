package com.gajraj.product.service;
import com.gajraj.product.dto.StudioMapping;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.ProductsRepo;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomerCustomizationTest {
    @Test void unavailableCategoriesAndStaleMappingsCannotBeUsed(){
        var repo=mock(ProductsRepo.class);var studio=mock(CategoryStudioService.class);
        var service=new CustomerCustomizationService(repo,studio);
        var category=new ProductCategories();category.setCategoryId(UUID.randomUUID());category.setCustomizable(false);
        var product=new Products();product.setCategory(category);product.setStatus("ACTIVE");product.setProductId(UUID.randomUUID());
        when(repo.findById(product.getProductId())).thenReturn(Optional.of(product));
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.configuration(product.getProductId())).getStatusCode().value());
        verifyNoInteractions(studio);
        category.setCustomizable(true);
        when(studio.get(category.getCategoryId())).thenReturn(Map.of("staleMapping",true,"mapping",new StudioMapping("new.glb",Map.of())));
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.configuration(product.getProductId())).getStatusCode().value());
    }
    @Test void versionIgnoresExpiringUrlsButDetectsChangedAssetAndColor(){
        var data=new HashMap<String,Object>();
        data.put("mapping",new StudioMapping("model.glb",Map.of("body",new StudioMapping.Region(List.of("0:0"),1,1,0,0,0))));
        data.put("defaults",Map.of());
        for(String key:List.of("bodyColors","borderColors","padar","border","butti"))data.put(key,List.of());
        UUID id=UUID.randomUUID();
        data.put("padar",List.of(new CategoryStudioService.Option(id,"Peacock","https://signed/old",null,"peacock.png")));
        String before=CustomerCustomizationService.version(data);
        data.put("padar",List.of(new CategoryStudioService.Option(id,"Peacock","https://signed/new",null,"peacock.png")));
        assertEquals(before,CustomerCustomizationService.version(data));
        data.put("padar",List.of(new CategoryStudioService.Option(id,"Peacock","https://signed/new",null,"replacement.png")));
        assertNotEquals(before,CustomerCustomizationService.version(data));
    }
}
