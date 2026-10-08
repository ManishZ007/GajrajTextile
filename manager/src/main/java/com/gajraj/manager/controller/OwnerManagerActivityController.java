package com.gajraj.manager.controller;
import com.gajraj.manager.feign.OwnerWorkerClient;
import com.gajraj.manager.repo.ManagerOrderAssignmentRepo;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController
@RequestMapping("/owner/managers")
public class OwnerManagerActivityController {
    private final OwnerWorkerClient workers;
    private final ManagerOrderAssignmentRepo assignments;
    public OwnerManagerActivityController(OwnerWorkerClient workers,ManagerOrderAssignmentRepo assignments) {
        this.workers=workers;this.assignments=assignments;
    }
    @GetMapping("/{id}/workers")
    @SuppressWarnings("unchecked")
    public Map<String,Object> workers(@PathVariable UUID id,@RequestHeader("Authorization") String authorization) {
        var rows=new ArrayList<Map<String,Object>>(workers.workers(id.toString(),authorization));
        for(var a:assignments.findByManagerIdOrderByAssignedAtDesc(id.toString())) {
            var row=rows.stream().filter(r->Objects.equals(r.get("workerId"),a.getWorkerId()) || Objects.equals(r.get("userId"),a.getWorkerId())).findFirst().orElse(null);
            if(row==null) {
                row=new LinkedHashMap<>();row.put("workerId",a.getWorkerId());row.put("code",null);
                row.put("createdByManager",false);row.put("status","UNKNOWN");row.put("assignments",new ArrayList<Map<String,Object>>());rows.add(row);
            }
            var items=(List<Map<String,Object>>)row.get("assignments");
            var item=new LinkedHashMap<String,Object>();item.put("id",a.getId());item.put("orderId",a.getOrderId());
            item.put("status",a.getState());item.put("task",a.getTaskType());item.put("date",a.getAssignedAt());item.put("source","manager");
            items.add(item);
        }
        long total=rows.stream().mapToLong(r->((List<?>)r.get("assignments")).size()).sum();
        return Map.of("created",rows.stream().filter(r->Boolean.TRUE.equals(r.get("createdByManager"))).count(),"assignments",total,"items",rows);
    }
}
