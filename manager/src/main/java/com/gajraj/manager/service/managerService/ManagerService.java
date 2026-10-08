package com.gajraj.manager.service.managerService;

import com.gajraj.manager.feign.ConnectionInterfaceAuthentication;
import com.gajraj.manager.model.Managers;
import com.gajraj.manager.repo.ManagerRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ManagerService {

    @Autowired
    private ManagerRepo managerRepo;

    @Autowired
    private ConnectionInterfaceAuthentication authClient;

    public Map<String, Object> getManagerProfile(String userId) {
        // Fetch auth info (name, email, phone, role, createdAt)
        ResponseEntity<Map<String, Object>> authResponse = authClient.userInfo(userId);
        Map<String, Object> body = authResponse.getBody() != null ? authResponse.getBody() : Map.of();

        // Auth service wraps user data under "auth" key — unwrap it, skip nulls
        Map<String, Object> result = new LinkedHashMap<>();
        Object authObj = body.get("auth");
        if (authObj instanceof Map<?, ?> authMap) {
            authMap.forEach((k, v) -> {
                if (v != null && !"commonResponse".equals(String.valueOf(k))) {
                    result.put(String.valueOf(k), v);
                }
            });
        }

        // Fetch manager-service DB row (gender, dob, roleType, status, managerId)
        Managers manager = managerRepo.findManagerByUserId(userId);

        if (manager != null) {
            result.put("managerId", manager.getManagerId());
            if (manager.getGender() != null)      result.put("gender", manager.getGender());
            if (manager.getDateOfBirth() != null)  result.put("dateOfBirth", manager.getDateOfBirth());
            if (manager.getRoleType() != null)     result.put("roleType", manager.getRoleType());
            if (manager.getStatus() != null)       result.put("managerStatus", manager.getStatus());
            result.put("managerCreatedAt", manager.getCreatedAt());
            result.put("managerUpdatedAt", manager.getUpdatedAt());
        }
        System.out.println(result);
        return result;
    }

    public Map<String, Object> updateManagerProfile(String userId, Map<String, String> body) {
        Managers manager = managerRepo.findManagerByUserId(userId);
        if (manager == null) throw new RuntimeException("Manager not found for userId: " + userId);

        String gender = body.get("gender");
        String dob = body.get("dateOfBirth");
        String roleType = body.get("roleType");
        String status = body.get("managerStatus");

        if (gender != null && !gender.isBlank())
            manager.setGender(Managers.GenderType.valueOf(gender.toUpperCase()));
        if (dob != null && !dob.isBlank())
            manager.setDateOfBirth(java.time.LocalDate.parse(dob));
        if (roleType != null && !roleType.isBlank())
            manager.setRoleType(Managers.ManagerType.valueOf(roleType.toUpperCase()));
        if (status != null && !status.isBlank())
            manager.setStatus(Managers.ManagerStatus.valueOf(status.toUpperCase()));

        managerRepo.save(manager);
        return getManagerProfile(userId);
    }
}
