package com.gajraj.authentication;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class AuthenticationApplication {

	public static void main(String[] args) {
		if (java.util.Arrays.asList(args).contains("--setup-owner")) {
			System.exit(com.gajraj.authentication.setup.OwnerSetupCommand.run(args));
			return;
		}
		SpringApplication.run(AuthenticationApplication.class, args);
	}

}
