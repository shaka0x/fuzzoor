import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { JSDOM } from 'jsdom';
import { FileUtils } from './fileUtils';
import { getConfig } from "./config";

export enum ReportType {
    ECHIDNA_COVERAGE,
    MEDUSA_COVERAGE,
}

export const openReport = (type: ReportType, contractPath?: string) => {
    const wsFolder = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const projectFolder = path.join(wsFolder, getConfig('projectFolder') as string);
    if (contractPath) {
        contractPath = path.relative(projectFolder, contractPath)
    }

    vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Opening coverage report...`,
          cancellable: true,
        },
        async () => {
          await openReportTask(projectFolder, type, contractPath);
        }
    );
};

const openReportTask = async (projectFolder: string, type: ReportType, contractPath?: string) => {
    let html = "";
    let iconPath = undefined;
    let title = contractPath ? "Coverage (" + path.basename(contractPath) + ")" : " Coverage";

    if (type === ReportType.ECHIDNA_COVERAGE) {
        title = "Echidna " + title;
        iconPath = {
            light: vscode.Uri.file(path.join(__filename, "..", "..", "resources", "light", "echidna_report.svg")),
            dark: vscode.Uri.file(path.join(__filename, "..", "..", "resources", "dark", "echidna_report.svg")),
        };
        const latestReportName = await findLatestEchidnaReport(path.join(projectFolder, "corpus_echidna"));
        if (!latestReportName) {
          vscode.window.showErrorMessage("Coverage report not found");
          return;
        }
        html = fs.readFileSync(path.join(projectFolder, "corpus_echidna", latestReportName), "utf8");
        html = html.replace("<style>", "<style> * { color: black; background-color: white; } code { color: black; }");
        if (contractPath) {
            html = extractContractFromEchidnaReport(html, contractPath);
            if (!html) {
                vscode.window.showErrorMessage("Contract not found in report");
                return;
            }
        }
    } else if (type === ReportType.MEDUSA_COVERAGE) {
        title = "Medusa " + title;
        iconPath = {
            light: vscode.Uri.file(path.join(__filename, "..", "..", "resources", "light", "medusa_report.svg")),
            dark: vscode.Uri.file(path.join(__filename, "..", "..", "resources", "dark", "medusa_report.svg")),
        };
        const reportPath = path.join(projectFolder, "corpus_medusa", "coverage_report.html");
        if (!fs.existsSync(reportPath)) {
            vscode.window.showErrorMessage("Coverage report not found");
            return;
        }
        html = fs.readFileSync(reportPath, "utf8");
        html = html.replace("<style>", "<style> * { color: black; }");
        if (contractPath) {
            html = extractContractFromMedusaReport(html, contractPath);
            if (!html) {
                vscode.window.showErrorMessage("Contract not found in report");
                return;
            }
        }
    } else {
        vscode.window.showErrorMessage("Invalid report type");
        return;
    }

    createPreviewPanel(title, html, iconPath);
}

const findLatestEchidnaReport = async (directoryPath: string) => {
  try {
      const files = await FileUtils.readDir(directoryPath);
      const regex = /^covered\.(\d+)\.html$/;
      let latestTimestamp = 0;
      let latestFile = null;

      for (const file of files) {
          const match = file.match(regex);
          if (match) {
              const timestamp = parseInt(match[1], 10);
              if (timestamp > latestTimestamp) {
                  latestTimestamp = timestamp;
                  latestFile = file;
              }
          }
      }

      return latestFile;
  } catch (err) {
      console.error(err);
      return null;
  }
}

const extractContractFromEchidnaReport = (htmlString: string, contractPath: string): string => {
    let htmlOutput = "";
    const dom = new JSDOM(htmlString);
    const doc = dom.window.document;
    const styleElement = doc.querySelector('style');
    if (!styleElement) return htmlOutput;

    const boldElements = doc.querySelectorAll('b');
    boldElements.forEach((boldElement) => {
        if (boldElement.textContent && boldElement.textContent.includes(contractPath)) {
            let nextSibling = boldElement.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.tagName.toLowerCase() === 'code') {
                    htmlOutput = styleElement.outerHTML + boldElement.outerHTML + nextSibling.outerHTML;
                    return;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
        }
    });
    
    return htmlOutput;
}

const extractContractFromMedusaReport = (htmlString: string, contractPath: string): string => {
    let htmlOutput = "";
    const dom = new JSDOM(htmlString);
    const doc = dom.window.document;
    const styleElement = doc.querySelector('style');
    if (!styleElement) return htmlOutput;

    const spans = doc.querySelectorAll('span');
    spans.forEach((spanElement) => {
        if (spanElement.textContent && spanElement.textContent.includes(contractPath)) {
            const buttonElement = spanElement.parentElement;
            if (buttonElement && buttonElement.tagName.toLowerCase() === 'button') {
                if (!buttonElement.classList.contains('collapsible-active')) {
                    buttonElement.classList.add('collapsible-active');
                }
                let nextSibling = buttonElement.nextElementSibling;
                while (nextSibling) {
                    if (nextSibling.tagName.toLowerCase() === 'div') {
                        htmlOutput = styleElement.outerHTML + buttonElement.outerHTML + nextSibling.outerHTML;
                        return;
                    }
                    nextSibling = nextSibling.nextElementSibling;
                }
            }
        }
    });
    
    return htmlOutput;
}

const createPreviewPanel = (
  title: string,
  html: string,
  iconPath: { light: vscode.Uri, dark: vscode.Uri } | undefined
) => {
    let webViewPanel = vscode.window.createWebviewPanel(
      "coverageReport",
      title,
      vscode.ViewColumn.Beside,
        {
            enableScripts: true,
        }
    );

    webViewPanel.webview.html = html;
    
    if (iconPath) {
      webViewPanel.iconPath = iconPath;
    }
  }
