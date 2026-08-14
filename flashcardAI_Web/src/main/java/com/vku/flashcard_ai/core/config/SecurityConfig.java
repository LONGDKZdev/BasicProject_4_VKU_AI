package com.vku.flashcard_ai.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/login",
                                                                "/register",
                                                                "/reset-password",
                                                                "/api/auth/reset-password",
                                                                "/css/**",
                                                                "/js/**",
                                                                "/images/**",
                                                                "/favicon.ico")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .formLogin(form -> form
                                                .loginPage("/login")
                                                .loginProcessingUrl("/login")
                                                .defaultSuccessUrl("/", true)
                                                .permitAll())
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessUrl("/login?logout")
                                                .invalidateHttpSession(true)
                                                .deleteCookies("JSESSIONID")
                                                .permitAll());

                return http.build();
        }

        // @Bean
        // PasswordEncoder passwordEncoder() {
        //         // Tự tạo PasswordEncoder thuần (không dùng class deprecated)
        //         return new PasswordEncoder() {
        //                 @Override
        //                 public String encode(CharSequence rawPassword) {
        //                         return rawPassword != null ? rawPassword.toString() : "";
        //                 }

        //                 @Override
        //                 public boolean matches(CharSequence rawPassword, String encodedPassword) {
        //                         if (rawPassword == null || encodedPassword == null)
        //                                 return false;
        //                         return rawPassword.toString().equals(encodedPassword);
        //                 }
        //         };
        // }
}