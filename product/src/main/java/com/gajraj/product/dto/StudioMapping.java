package com.gajraj.product.dto;
import java.util.List;
import java.util.Map;
public record StudioMapping(String modelKey, Map<String,Region> regions) {
    public record Region(List<String> targets,double repeatX,double repeatY,double offsetX,double offsetY,double rotation) {}
}
