package com.example.whereismybus.controller;

import com.example.whereismybus.entity.AppRelease;
import com.example.whereismybus.repository.AppReleaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AppReleaseController {

    @Autowired
    private AppReleaseRepository appReleaseRepository;

    @PostMapping("/admin/app/link")
    public ResponseEntity<Map<String, String>> uploadAppLink(@RequestBody Map<String, String> body) {
        Map<String, String> response = new HashMap<>();
        try {
            String url = body.get("downloadUrl");
            if (url == null || url.trim().isEmpty()) {
                response.put("error", "Download link cannot be empty");
                return ResponseEntity.badRequest().body(response);
            }

            AppRelease release = new AppRelease();
            release.setFileName("External Link");
            release.setVersion("latest");
            release.setDownloadUrl(url.trim());

            appReleaseRepository.save(release);

            response.put("message", "App link saved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Failed to save link: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/app/download")
    public ResponseEntity<Void> downloadApp() {
        Optional<AppRelease> releaseOpt = appReleaseRepository.findTopByOrderByIdDesc();
        if (!releaseOpt.isPresent() || releaseOpt.get().getDownloadUrl() == null) {
            return ResponseEntity.notFound().build();
        }

        String downloadUrl = releaseOpt.get().getDownloadUrl();
        
        // Return 302 Found redirect to the Google Drive/external link
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(downloadUrl))
                .build();
    }
}


