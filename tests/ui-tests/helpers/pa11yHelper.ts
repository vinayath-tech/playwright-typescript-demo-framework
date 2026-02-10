import { expect } from "playwright/test";
import { createHtmlReport } from "axe-html-reporter";
import fs from 'fs';


export async function checkAccessibility(axeBuilder: any) {

    const accessibilityScanResults = await axeBuilder().analyze();
    const reportHTML = createHtmlReport({
        results: accessibilityScanResults,
        options: {
            projectKey: "playwright-typescript-demo-framework",
            reportFileName: "accessibility-report.html"
        },
    });

    if(!fs.existsSync('accessibility-reports/report.html')) { 
        fs.mkdirSync('accessibility-reports', { recursive: true });
    }

    fs.writeFileSync('accessibility-reports/report.html', reportHTML);
    expect(accessibilityScanResults.violations).not.toEqual([]);
}