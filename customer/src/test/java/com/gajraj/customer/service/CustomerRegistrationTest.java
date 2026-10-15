package com.gajraj.customer.service;
import com.gajraj.customer.dto.userDTO.SaveUserReq;
import com.gajraj.customer.model.Customers;
import com.gajraj.customer.repo.CustomerRepo;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class CustomerRegistrationTest {
    @Test void databaseFailureMustNotReturnSuccess(){
        var repo=mock(CustomerRepo.class);var service=new InternalCustomerService();service.customerRepo=repo;
        when(repo.saveAndFlush(any())).thenThrow(new org.springframework.dao.DataAccessResourceFailureException("offline"));
        var response=service.saveNewUser(new SaveUserReq("user"));
        assertEquals(500,response.getStatusCode().value());assertEquals(false,((Map<?,?>)response.getBody()).get("success"));
    }
    @Test void successIncludesPersistedProfile(){
        var repo=mock(CustomerRepo.class);var service=new InternalCustomerService();service.customerRepo=repo;
        when(repo.saveAndFlush(any())).thenAnswer(call->call.getArgument(0));
        var response=service.saveNewUser(new SaveUserReq("user"));
        assertEquals(200,response.getStatusCode().value());assertInstanceOf(Customers.class,((Map<?,?>)response.getBody()).get("customer"));
    }
}
