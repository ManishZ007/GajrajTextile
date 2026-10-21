package com.gajraj.product.service;
import com.gajraj.product.dto.StudioMapping;
import com.gajraj.product.model.*;
import com.gajraj.product.repo.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CategoryStudioTest {
    StudioMapping.Region region(String target){return new StudioMapping.Region(List.of(target),1,1,0,0,0);}
    @Test void rejectsOverlapAndNonFiniteTransforms(){
        assertThrows(ResponseStatusException.class,()->CategoryStudioService.validate(new StudioMapping("model",Map.of("body",region("0.1:0"),"padar",region("0.1:0")))));
        assertThrows(ResponseStatusException.class,()->CategoryStudioService.validate(new StudioMapping("model",Map.of("body",new StudioMapping.Region(List.of("0.1:0"),Double.NaN,1,0,0,0)))));
        assertThrows(ResponseStatusException.class,()->CategoryStudioService.validate(new StudioMapping("model",Map.of("mannequin",region("0.1:0")))));
        assertDoesNotThrow(()->CategoryStudioService.validate(new StudioMapping("model",Map.of("body",region("0.1:0"),"padar",region("0.2:0")))));
    }
    @Test void savedMappingRoundTripsAndReplacementInvalidatesIt(){
        var categories=mock(ProductCategoriesRepo.class);var studios=mock(CategoryStudioRepo.class);var s3=mock(S3Service.class);
        var service=new CategoryStudioService(categories,studios,mock(PadarRepo.class),mock(BorderRepo.class),mock(ButtiRepo.class),mock(BodyColorRepo.class),mock(BorderColorRepo.class),s3);
        UUID id=UUID.randomUUID();var category=new ProductCategories();category.setBaseModelUrl("models/old.glb");
        when(categories.findById(id)).thenReturn(Optional.of(category));when(s3.generateViewUrl(anyString())).thenAnswer(c->"https://signed.example/"+c.getArgument(0));
        var map=new StudioMapping("models/old.glb",Map.of("body",region("0.1:0")));
        service.save(id,map);
        var capture=org.mockito.ArgumentCaptor.forClass(CategoryStudio.class);verify(studios).save(capture.capture());
        when(studios.findById(id)).thenReturn(Optional.of(capture.getValue()));
        assertEquals(map,service.get(id).get("mapping"));
        assertEquals("https://signed.example/models/old.glb",service.get(id).get("modelUrl"));
        category.setBaseModelUrl("models/new.glb");
        var response=service.get(id);assertEquals(true,response.get("staleMapping"));
        assertTrue(((StudioMapping)response.get("mapping")).regions().isEmpty());
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.save(id,map)).getStatusCode().value());
    }
}
