package com.gajraj.product.service;
import com.gajraj.product.dto.StudioMapping;
import com.gajraj.product.model.CustomDesignRequest;
import com.gajraj.product.repo.CustomDesignRequestRepo;
import org.junit.jupiter.api.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CustomDesignRequestTest {
    final CustomDesignRequestRepo repo=mock(CustomDesignRequestRepo.class);
    final CustomerCustomizationService configurations=mock(CustomerCustomizationService.class);
    final S3Service s3=mock(S3Service.class);
    final CustomDesignRequestService service=new CustomDesignRequestService(repo,configurations,s3);
    final UUID product=UUID.randomUUID(),color=UUID.randomUUID(),request=UUID.randomUUID();
    Map<String,Object> config;
    @BeforeEach void setup(){
        config=new LinkedHashMap<>();
        config.put("mapping",new StudioMapping("models/original.glb",Map.of("body",new StudioMapping.Region(List.of("0.1:0"),1,1,0,0,0))));
        config.put("configurationVersion","v1");config.put("productName","Custom saree");config.put("categoryName","Paithani");
        config.put("bodyColors",List.of(new CategoryStudioService.Option(color,"Red",null,"#ff0000",null)));
        config.put("borderColors",List.of());config.put("padar",List.of());config.put("border",List.of());config.put("butti",List.of());
        when(configurations.configuration(product)).thenReturn(config);
        when(repo.save(any())).thenAnswer(c->{CustomDesignRequest r=c.getArgument(0);r.setVersion(0L);return r;});
        when(repo.saveAndFlush(any())).thenAnswer(c->c.getArgument(0));
        when(s3.generateViewUrl(anyString())).thenAnswer(c->"https://view.example/"+c.getArgument(0));
    }
    CustomDesignRequestService.Submit body(String version,Map<String,String> selections){
        return new CustomDesignRequestService.Submit(request,product,version,selections,"Customer","9876543210","Please call");
    }
    CustomDesignRequest saved(){
        service.submit(body("v1",Map.of("bodyColor",color.toString())),"customer");
        var capture=org.mockito.ArgumentCaptor.forClass(CustomDesignRequest.class);verify(repo).save(capture.capture());
        var entity=capture.getValue();when(repo.findById(request)).thenReturn(Optional.of(entity));return entity;
    }
    @Test void snapshotSurvivesCatalogChangesAndDoesNotStoreSignedUrls(){
        var entity=saved();
        config.put("mapping",new StudioMapping("new.glb",Map.of()));
        assertTrue(entity.getSnapshot().contains("models/original.glb"));assertFalse(entity.getSnapshot().contains("https://"));
        Map<?,?> detail=(Map<?,?>)service.detail(request,"customer",false);
        assertEquals("https://view.example/models/original.glb",detail.get("modelUrl"));
        assertEquals("Red",((Map<?,?>)((Map<?,?>)detail.get("selections")).get("bodyColor")).get("name"));
    }
    @Test void duplicateSubmissionIsIdempotentAndChangedPayloadConflicts(){
        saved();
        service.submit(body("v1",Map.of("bodyColor",color.toString())),"customer");
        verify(repo,times(1)).save(any());
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.submit(body("v1",Map.of()),"customer")).getStatusCode().value());
    }
    @Test void staleConfigurationAndForeignOptionsAreRejected(){
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.submit(body("old",Map.of()),"customer")).getStatusCode().value());
        assertEquals(400,assertThrows(ResponseStatusException.class,()->service.submit(body("v1",Map.of("bodyColor",UUID.randomUUID().toString())),"customer")).getStatusCode().value());
        assertEquals(400,assertThrows(ResponseStatusException.class,()->service.submit(body("v1",Map.of("border","bad")),"customer")).getStatusCode().value());
        verify(repo,never()).save(any());
    }
    @Test void customerCannotReadAnotherCustomersDesign(){
        saved();
        assertEquals(404,assertThrows(ResponseStatusException.class,()->service.detail(request,"other-customer",false)).getStatusCode().value());
        assertDoesNotThrow(()->service.detail(request,"manager",true));
    }
    @Test void quotesValidatePriceAndConcurrencyAndAppearToCustomer(){
        var entity=saved();
        assertThrows(ResponseStatusException.class,()->service.quote(request,new CustomDesignRequestService.Quote(BigDecimal.ZERO,"",0L),"manager"));
        assertEquals(409,assertThrows(ResponseStatusException.class,()->service.quote(request,new CustomDesignRequestService.Quote(new BigDecimal("12000"),"",5L),"manager")).getStatusCode().value());
        service.quote(request,new CustomDesignRequestService.Quote(new BigDecimal("12000"),"Four weeks",0L),"manager");
        assertEquals("QUOTED",entity.getStatus());assertEquals("manager",entity.getQuotedBy());
        assertEquals(new BigDecimal("12000"),((Map<?,?>)service.detail(request,"customer",false)).get("quoteAmount"));
    }
}
