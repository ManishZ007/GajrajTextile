package com.gajraj.order.service;
import com.gajraj.order.repo.OrdersRepo;
import org.springframework.stereotype.Component;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ReservationNumberMigration implements ApplicationRunner {
    private final OrdersRepo orders;
    public ReservationNumberMigration(OrdersRepo orders) { this.orders=orders; }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        orders.lockNumberSeries("reservation-number-migration");
        for(String prefix:java.util.List.of("RES","ORES")) {
            for(var order:orders.findByOrderNumberStartingWithOrderByOrderDateAsc(prefix+"-")) {
                if(!order.getOrderNumber().matches(prefix+"-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) continue;
                int year=order.getOrderDate()==null ? java.time.LocalDate.now().getYear() : order.getOrderDate().getYear();
                order.setOrderNumber(OrderNumbers.next(orders,prefix,year));
                orders.saveAndFlush(order);
            }
        }
    }
}
