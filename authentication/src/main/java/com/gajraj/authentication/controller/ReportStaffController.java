package com.gajraj.authentication.controller;
import com.gajraj.authentication.repo.UserRepo;
import com.gajraj.authentication.model.Users;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
public class ReportStaffController {
 private final UserRepo users;
 public ReportStaffController(UserRepo users){this.users=users;}
 public record Staff(UUID id,String name) {}
 @GetMapping("/auth/admin/report-staff")
 public List<Staff> staff(){
  var result=new ArrayList<Staff>();
  for(var role:List.of(Users.Role.MANAGER,Users.Role.OWNER))
   for(var u:users.findByRoleOrderByCreatedAtDesc(role)) result.add(new Staff(u.getUser_id(),u.getFullName()));
  return result;
 }
}
