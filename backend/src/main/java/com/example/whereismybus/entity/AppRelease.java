package com.example.whereismybus.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "app_release")
public class AppRelease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    
    private String version;

    private String downloadUrl;

    // Constructors
    public AppRelease() {}

    public AppRelease(String fileName, String version, String downloadUrl) {
        this.fileName = fileName;
        this.version = version;
        this.downloadUrl = downloadUrl;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }
}
