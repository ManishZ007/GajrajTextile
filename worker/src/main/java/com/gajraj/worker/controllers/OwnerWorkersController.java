package com.gajraj.worker.controllers;
import com.gajraj.worker.repo.WorkerRepo;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@RestController
@RequestMapping("/owner/managers")
public class OwnerWorkersController {
    private final WorkerRepo workers;
    public OwnerWorkersController(WorkerRepo workers) {this.workers=workers;}
    @GetMapping("/{id}/workers")
    @Transactional(readOnly=true)
    public List<Map<String,Object>> activity(@PathVariable UUID id) {
        return workers.ownerActivity(id.toString(),id).stream().map(w->{
            Map<String,Object> row=new LinkedHashMap<>();
            var verification=w.getVerification();
            String creator=w.getCreatedByManagerId();
            if(creator==null && verification!=null && "Initial registration".equals(verification.getReason())) creator=verification.getChangeBy();
            row.put("workerId",w.getWorkerId().toString());row.put("userId",w.getUserId());row.put("code",w.getWorkerCode());
            row.put("createdByManager",id.toString().equals(creator));
            row.put("status",verification==null?"PENDING":verification.getNewStatus());
            row.put("createdAt",w.getCreatedAt());
            var assignments=new ArrayList<Map<String,Object>>();
            if(w.getAssignments()!=null) for(var a:w.getAssignments()) if(id.equals(a.getAssignedBy())) {
                Map<String,Object> item=new LinkedHashMap<>();
                item.put("id",a.getId());item.put("orderId",Long.toString(a.getOrderId()));
                item.put("status",a.getStatus());item.put("date",a.getAssignedDate());item.put("source","legacy");
                assignments.add(item);
            }
            row.put("assignments",assignments);return row;
        }).toList();
    }
}
