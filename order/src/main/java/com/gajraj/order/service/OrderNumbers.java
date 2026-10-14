package com.gajraj.order.service;
import com.gajraj.order.repo.OrdersRepo;
import java.util.Set;

public final class OrderNumbers {
    private OrderNumbers() {}
    // Caller holds a transaction through insertion; serializes separate service instances too.
    public static String next(OrdersRepo repo,String prefix,int year) {
        if(!Set.of("ORD","RES","ORES").contains(prefix)) throw new IllegalArgumentException("Invalid order category");
        repo.lockNumberSeries("order-number:"+prefix+":"+year);
        long number=repo.nextNumber("^"+prefix+"-"+year+"-[0-9]+$");
        return String.format(java.util.Locale.ROOT,"%s-%d-%04d",prefix,year,number);
    }
}
