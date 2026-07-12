package com.gajraj.shipping.provider;

import com.gajraj.shipping.enums.Provider;
import com.gajraj.shipping.enums.ShipmentStatus;
import com.gajraj.shipping.provider.model.ShipmentProviderRequest;
import com.gajraj.shipping.provider.model.ShipmentProviderResult;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;

@Component
public class MockShippingProvider implements ShippingProvider {

    private static final Random RANDOM = new Random();

    private static final Map<ShipmentStatus, ShipmentStatus> NEXT_STATUS = Map.of(
            ShipmentStatus.CREATED,          ShipmentStatus.PACKED,
            ShipmentStatus.PACKED,           ShipmentStatus.READY_FOR_PICKUP,
            ShipmentStatus.READY_FOR_PICKUP, ShipmentStatus.PICKED_UP,
            ShipmentStatus.PICKED_UP,        ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.IN_TRANSIT,       ShipmentStatus.ARRIVED_AT_HUB,
            ShipmentStatus.ARRIVED_AT_HUB,   ShipmentStatus.OUT_FOR_DELIVERY,
            ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERED
    );

    private static final Map<ShipmentStatus, String[]> STATUS_META = Map.of(
            ShipmentStatus.CREATED,          new String[]{"Order Created",       "Your order has been received and is being processed.",   "Nashik Warehouse"},
            ShipmentStatus.PACKED,           new String[]{"Order Packed",        "Your order has been packed and is ready for dispatch.",   "Nashik Warehouse"},
            ShipmentStatus.READY_FOR_PICKUP, new String[]{"Ready for Pickup",    "Package is ready and awaiting courier pickup.",            "Nashik Warehouse"},
            ShipmentStatus.PICKED_UP,        new String[]{"Picked Up",           "Package has been picked up by the courier partner.",       "Nashik Warehouse"},
            ShipmentStatus.IN_TRANSIT,       new String[]{"In Transit",          "Package is in transit to the sorting hub.",                "Mumbai Hub"},
            ShipmentStatus.ARRIVED_AT_HUB,  new String[]{"Arrived at Hub",      "Package has arrived at the regional distribution hub.",    "Pune Hub"},
            ShipmentStatus.OUT_FOR_DELIVERY, new String[]{"Out for Delivery",    "Package is out for delivery and will arrive today.",       "Customer City"},
            ShipmentStatus.DELIVERED,        new String[]{"Delivered",           "Package has been successfully delivered.",                 "Customer City"}
    );

    @Override
    public ShipmentProviderResult createShipment(ShipmentProviderRequest request) {
        String trackingNumber = "TRK" + generateNumeric(10);
        String awbNumber      = "AWB" + generateNumeric(8);
        int daysToDelivery    = 4 + RANDOM.nextInt(4); // 4–7 days

        return ShipmentProviderResult.builder()
                .trackingNumber(trackingNumber)
                .awbNumber(awbNumber)
                .courierName("Mock Express Courier")
                .trackingUrl("https://mock-tracking.example.com/track/" + trackingNumber)
                .estimatedDelivery(LocalDateTime.now().plusDays(daysToDelivery))
                .provider(Provider.MOCK)
                .build();
    }

    @Override
    public boolean cancelShipment(String awbNumber) {
        return true;
    }

    @Override
    public Provider getProviderName() {
        return Provider.MOCK;
    }

    public ShipmentStatus getNextStatus(ShipmentStatus current) {
        return NEXT_STATUS.get(current);
    }

    public String[] getStatusMeta(ShipmentStatus status) {
        return STATUS_META.getOrDefault(status, new String[]{"Update", "Status updated.", "Unknown"});
    }

    private String generateNumeric(int digits) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < digits; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
