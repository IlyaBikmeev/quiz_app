package ru.bikmeev.quizz.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
            "/",
            "/login",
            "/register",
            "/verify",
            "/quizzes",
            "/quizzes/**",
            "/profile",
            "/settings",
            "/card-sets/**"
    })
    public String forwardToFrontend() {
        return "forward:/index.html";
    }
}
