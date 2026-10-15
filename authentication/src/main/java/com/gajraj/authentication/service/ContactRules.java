package com.gajraj.authentication.service;

import java.util.Locale;

public final class ContactRules {
    private ContactRules() {}
    public static String email(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }
    public static String mobile(String input) {
        if(input == null || input.length() > 24) throw new IllegalArgumentException("Enter a 10-digit mobile number starting with 6, 7, 8 or 9");
        String phone=input.replaceAll("[\\s()-]", "");
        if(phone.startsWith("+91")) phone=phone.substring(3);
        if(!phone.matches("[6-9][0-9]{9}")) throw new IllegalArgumentException("Enter a 10-digit mobile number starting with 6, 7, 8 or 9");
        return phone;
    }
}
