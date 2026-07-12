package com.gajraj.product.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class S3Service {
    private final S3Presigner presigner;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    public S3Service (@Value("${aws.region}") String region,
                      @Value("${aws.access-key}") String accessKey,
                      @Value("${aws.secret-key}") String secretKey) {
        StaticCredentialsProvider credentials = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey));
        Region awsRegion = Region.of(region);

        this.presigner = S3Presigner.builder()
                .region(awsRegion)
                .credentialsProvider(credentials)
                .build();

        this.s3Client = S3Client.builder()
                .region(awsRegion)
                .credentialsProvider(credentials)
                .build();
    }

    public Map<String, String> generateUploadUrl(String category, String originalFileName) {
        String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        String key = category + "/" + UUID.randomUUID() + extension;

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .putObjectRequest(putRequest)
                .signatureDuration(Duration.ofMinutes(10))
                .build();

        PresignedPutObjectRequest presigned = presigner.presignPutObject(presignRequest);

        return Map.of(
                "uploadUrl", presigned.url().toString(),
                "key", key
        );
    }

    public String generateViewUrl(String key) {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .getObjectRequest(getRequest)
                .signatureDuration(Duration.ofHours(1))
                .build();

        return presigner.presignGetObject(presignRequest).url().toString();
    }

    public List<Map<String, String>> generateMultipleUploadUrls(String category, List<String> fileNames) {
        List<Map<String, String>> results = new ArrayList<>();
        for (String fileName : fileNames) {
            results.add(generateUploadUrl(category, fileName));
        }
        return results;
    }

    public void deleteObject(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
    }

}
