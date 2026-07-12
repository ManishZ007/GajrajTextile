package com.gajraj.shipping.provider;

import com.gajraj.shipping.enums.Provider;
import com.gajraj.shipping.provider.model.ShipmentProviderRequest;
import com.gajraj.shipping.provider.model.ShipmentProviderResult;

public interface ShippingProvider {

    ShipmentProviderResult createShipment(ShipmentProviderRequest request);

    boolean cancelShipment(String awbNumber);

    Provider getProviderName();
}
