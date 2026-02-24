import fs from 'fs';
import { TestCase, TestResult } from "playwright/types/testReporter";

export class ScreenshotExtractor {

    extract(test: TestCase, result: TestResult): { screenshotBase64?: string, mimeType?: string } {
    
    
        const screenshotAttachment = result.attachments?.find(
                    att => att.name === 'screenshot' && att.contentType.startsWith('image/')
                );
        
                if(!screenshotAttachment){
                    return {};
                }
        
                try{
                    if(screenshotAttachment.body) {
                        return {
                            screenshotBase64: screenshotAttachment.body.toString('base64'),
                            mimeType: screenshotAttachment.contentType
                        };
                    }
        
                    if(screenshotAttachment.path && fs.existsSync(screenshotAttachment.path)) {
                        const fileBuffer = fs.readFileSync(screenshotAttachment.path);
                        return {
                            screenshotBase64: fileBuffer.toString('base64'),
                            mimeType: screenshotAttachment.contentType
                        };
                    }
        
                } catch (error) {
                    console.warn(`[ai-failure-analysis] Failed to read screenshot for ${test.title}`, error);
                }
        
                return {};
    };
}