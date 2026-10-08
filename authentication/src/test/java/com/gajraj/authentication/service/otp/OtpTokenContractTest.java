package com.gajraj.authentication.service.otp;

import com.gajraj.authentication.service.AuthService;
import com.gajraj.authentication.service.jwtService.JWTService;
import com.gajraj.authentication.service.jwtService.RefreshTokenService;
import com.gajraj.authentication.repo.RefreshTokenRepo;
import com.gajraj.authentication.model.RefreshToken;
import com.gajraj.authentication.model.Users;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OtpTokenContractTest {
    @Test void createsThenRotatesExistingTokensWithTheSameCustomerContract() {
        AuthService auth=new AuthService();
        var repo=mock(RefreshTokenRepo.class);var refresh=mock(RefreshTokenService.class);var jwt=mock(JWTService.class);
        ReflectionTestUtils.setField(auth,"refreshTokenRepo",repo);
        ReflectionTestUtils.setField(auth,"refreshTokenService",refresh);
        ReflectionTestUtils.setField(auth,"jwtService",jwt);
        ReflectionTestUtils.setField(auth,"expiration",900000L);
        Users user=new Users();user.setUser_id(UUID.randomUUID());user.setRole(Users.Role.CUSTOMER);
        RefreshToken token=new RefreshToken();token.setRefreshToken("first-refresh");
        when(jwt.generateToken(user.getUser_id().toString(),"CUSTOMER")).thenReturn("access-token");
        when(refresh.createRefreshToken(user)).thenReturn(token);
        var first=auth.issueLoginTokens(user);
        assertEquals("access-token",first.getAccess_token());assertEquals("first-refresh",first.getRefresh_token());
        assertEquals(user.getUser_id().toString(),first.getUser_id());assertEquals(900000L,first.getExpires_in());
        when(repo.findByUserId(user.getUser_id())).thenReturn(token);
        when(refresh.updateRefreshToken(user.getUser_id())).thenReturn("rotated-refresh");
        var second=auth.issueLoginTokens(user);assertEquals("rotated-refresh",second.getRefresh_token());
        verify(refresh,times(1)).createRefreshToken(user);verify(refresh).updateRefreshToken(user.getUser_id());
    }
}
