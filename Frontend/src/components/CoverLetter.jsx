import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import { API_URL, getAuthHeaders } from '../utils'; // Ensure this path is correct
import styles from './CoverLetter.module.css'; // Ensure this matches your CSS module filename

// --- ICON COMPONENTS ---
const LoadingSpinner = () => <div className={styles.spinnerSmall}></div>;
const DownloadIcon = () => <span role="img" aria-label="download">📄</span>;
// HistoryIcon is used in JSX
const HistoryIcon = () => <span role="img" aria-label="history">📜</span>;
const CopyIcon = () => <span role="img" aria-label="copy">📋</span>;

// ChevronDownIcon, ChevronUpIcon, InterviewIcon were listed as unused in other components,
// assuming they might have been here too originally, they are removed if not present.

// --- TEMPLATE STATIC ELEMENT DRAWING HELPERS ---
const drawHeaderBarForTemplate = (doc, pdfParams, localFormData) => {
    const { pageW, mL_orig } = pdfParams;
    const headerBarHeight = 15;
    doc.setFillColor(60, 90, 130);
    doc.rect(0, 0, pageW, headerBarHeight, 'F');

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    if (localFormData && localFormData.fullName) {
       doc.text(localFormData.fullName, mL_orig, headerBarHeight * 0.65 , { baseline: 'middle' });
    }
    doc.setFont("times", "normal");
    doc.setTextColor(0,0,0);
    doc.setFontSize(12);
    return headerBarHeight;
};

const drawSidebarForTemplate = (doc, pdfParams) => {
    const { pageW, pageH } = pdfParams;
    const sidebarWidth = pageW * 0.30;
    doc.setFillColor(40, 60, 80);
    doc.rect(0, 0, sidebarWidth, pageH, 'F');
};

let currentPageBreakInfo = {
    templateId: null,
    pdfParams: null,
    docInstance: null,
    localFormDataRef: null,
    profilePicPreviewRef: null, // Add profilePicPreview to global info
};

const addLineToPdfHelper = (text, x, currentY, options = {}, maxWidth) => {
    const { docInstance, templateId, pdfParams, localFormDataRef, profilePicPreviewRef } = currentPageBreakInfo;
    const { pageH, mB, mT, blh } = pdfParams;
    let newY = currentY;
    const textHeight = blh;

    if (newY + textHeight > pageH - mB) {
        docInstance.addPage();
        newY = mT;
        if (templateId === 'sidebarInfo') {
            drawSidebarForTemplate(docInstance, pdfParams);
             // If sidebar content (like pic) needs to be repeated, it's complex.
            // For now, just the bar.
            if (profilePicPreviewRef && templateId === 'sidebarInfo') { // Redraw profile pic in sidebar on new page
                // This is a simplified version. A full redraw would need the sidebar content logic.
                 try {
                    const sidebarWidth = pdfParams.pageW * 0.30;
                    const sidebarPadding = 10;
                    const sidebarContentWidth = sidebarWidth - (2 * sidebarPadding);
                    const imgProps = docInstance.getImageProperties(profilePicPreviewRef);
                    let imgDesiredWidth = sidebarContentWidth * 0.8;
                    let imgDisplayHeight = (imgProps.height * imgDesiredWidth) / imgProps.width;
                     if (imgDesiredWidth > sidebarContentWidth) { /* adjust */ }
                    if (mT + imgDisplayHeight < pageH - mB) {
                        const imgX = sidebarPadding + (sidebarContentWidth - imgDesiredWidth) / 2;
                        docInstance.addImage(profilePicPreviewRef, imgProps.fileType || 'JPEG', imgX, mT, imgDesiredWidth, imgDisplayHeight);
                    }
                } catch(e){ console.error("Error redrawing profile pic in sidebar:", e)}
            }
        } else if (templateId === 'headerBar') {
            const headerHeight = drawHeaderBarForTemplate(docInstance, pdfParams, localFormDataRef);
            newY = headerHeight + blh;
        }
        // Potentially redraw profile pic for other templates if they have fixed position pics
        // that should appear on every page (less common for cover letters).
    }

    const textOptions = { ...options };
    if (maxWidth) textOptions.maxWidth = maxWidth;
    docInstance.text(text, x, newY, textOptions);
    return newY + blh;
};

const addBodyParagraphsHelper = (bodyText, mL, initialY, uW, fullNameForClosing) => {
    const { pdfParams } = currentPageBreakInfo;
    // paraSpacing is used directly from pdfParams.paraSpacing below, local var not needed
    let cY = initialY;

    const paragraphs = bodyText.split(/\n\s*\n/);
    paragraphs.forEach((pText) => {
        const trimmedParagraph = pText.trim();
        if (trimmedParagraph === '') return;
        const lines = currentPageBreakInfo.docInstance.splitTextToSize(trimmedParagraph, uW);
        lines.forEach(line => {
            cY = addLineToPdfHelper(line, mL, cY, {}, uW);
        });
        if (!(trimmedParagraph.toLowerCase().startsWith("sincerely") ||
              trimmedParagraph.toLowerCase().startsWith("regards") ||
              (fullNameForClosing && trimmedParagraph.toLowerCase() === fullNameForClosing.toLowerCase()))) {
            cY += pdfParams.paraSpacing; // Use directly from pdfParams
        }
    });
    return cY;
};

const addSignatureAndNameHelper = (signatureImgPreview, fullName, mL, initialY) => {
    const { docInstance, pdfParams, localFormDataRef, templateId } = currentPageBreakInfo;
    const { pageH, mB, mT, blh } = pdfParams;
    let cY = initialY;

    if (signatureImgPreview) {
        cY += blh * 0.5;
        try {
            const sigProps = docInstance.getImageProperties(signatureImgPreview);
            const sigW = 45; const sigH = (sigProps.height * sigW) / sigProps.width;
            if (cY + sigH > pageH - mB) {
                docInstance.addPage();
                cY = mT;
                if (templateId === 'sidebarInfo') {
                    drawSidebarForTemplate(docInstance, pdfParams);
                } else if (templateId === 'headerBar') {
                    const headerHeight = drawHeaderBarForTemplate(docInstance, pdfParams, localFormDataRef);
                    cY = headerHeight + blh;
                }
            }
            docInstance.addImage(signatureImgPreview, sigProps.fileType || 'PNG', mL, cY, sigW, sigH);
            cY += sigH;
        } catch (e) { console.error("Error adding signature:", e); }
    } else {
        const neededSpace = blh * 2;
         if (cY + neededSpace > pageH - mB) {
            docInstance.addPage();
            cY = mT;
            if (templateId === 'sidebarInfo') {
                drawSidebarForTemplate(docInstance, pdfParams);
            } else if (templateId === 'headerBar') {
                 const headerHeight = drawHeaderBarForTemplate(docInstance, pdfParams, localFormDataRef);
                 cY = headerHeight + blh;
            }
        }
        cY += blh * 2;
    }
    return cY;
};

// --- TEMPLATE RENDERING FUNCTIONS ---
const renderClassicTemplate = (localFormData, letterBody, profilePicPreview, signatureImgPreview) => {
    const { docInstance, pdfParams } = currentPageBreakInfo;
    const { pageW, pageH, mL, mR, mT, mB, uW, blh } = pdfParams;
    let cY = mT;
    docInstance.setFont("times", "normal"); docInstance.setTextColor(0,0,0);

    let profilePicEndY = mT;
    if (profilePicPreview) { try { const imgProps = docInstance.getImageProperties(profilePicPreview); const imgDesiredWidth = 30; const imgDisplayHeight = (imgProps.height*imgDesiredWidth)/imgProps.width; const picX = pageW-mR-imgDesiredWidth; if(mT+imgDisplayHeight < pageH-mB){ docInstance.addImage(profilePicPreview, imgProps.fileType||'JPEG',picX,mT,imgDesiredWidth,imgDisplayHeight); profilePicEndY=mT+imgDisplayHeight+blh*0.5;}}catch(e){console.error("Error adding profile picture (Classic):",e);}}

    docInstance.setFontSize(18); docInstance.setFont("times", "bold");
    if (localFormData.fullName) cY = addLineToPdfHelper(localFormData.fullName, mL, cY, {}, uW);
    docInstance.setFont("times", "normal"); docInstance.setFontSize(10);
    if (localFormData.email) cY = addLineToPdfHelper(localFormData.email, mL, cY, {}, uW);
    if (localFormData.phone) cY = addLineToPdfHelper(localFormData.phone, mL, cY, {}, uW);
    if (localFormData.linkedin) cY = addLineToPdfHelper(localFormData.linkedin, mL, cY, {}, uW);
    if (localFormData.portfolio) cY = addLineToPdfHelper(localFormData.portfolio, mL, cY, {}, uW);
    cY = Math.max(cY, profilePicEndY) + blh * 0.5;
    docInstance.setFontSize(12); const today = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); cY = addLineToPdfHelper(today,mL,cY,{},uW); cY += blh;
    if (localFormData.recipientName) cY = addLineToPdfHelper(localFormData.recipientName,mL,cY,{},uW);
    if (localFormData.recipientTitle) cY = addLineToPdfHelper(localFormData.recipientTitle,mL,cY,{},uW);
    if (localFormData.companyName) cY = addLineToPdfHelper(localFormData.companyName,mL,cY,{},uW);
    if (localFormData.companyAddress){ const addressLines=docInstance.splitTextToSize(localFormData.companyAddress,uW); addressLines.forEach(line => {cY=addLineToPdfHelper(line,mL,cY,{},uW);});} cY += blh;
    cY = addBodyParagraphsHelper(letterBody, mL, cY, uW, localFormData.fullName);
    addSignatureAndNameHelper(signatureImgPreview, localFormData.fullName, mL, cY);
};
const renderHeaderBarTemplate = (localFormData, letterBody, profilePicPreview, signatureImgPreview) => {
    const { docInstance, pdfParams } = currentPageBreakInfo;
    const { pageH, mL, mB, uW, blh } = pdfParams; // pageW, mT used in helper calls
    const headerHeight = drawHeaderBarForTemplate(docInstance, pdfParams, localFormData);
    let cY = headerHeight + blh;
    let profilePicEndY = cY;
    if (profilePicPreview) { try { const imgProps = docInstance.getImageProperties(profilePicPreview); const imgDesiredWidth = 25; const imgDisplayHeight = (imgProps.height*imgDesiredWidth)/imgProps.width; const picX = mL; const picY = cY; if(picY+imgDisplayHeight<pageH-mB){ docInstance.addImage(profilePicPreview,imgProps.fileType||'JPEG',picX,picY,imgDesiredWidth,imgDisplayHeight); profilePicEndY=picY+imgDisplayHeight+blh*0.5;}}catch(e){console.error("Error adding profile picture (HeaderBar):",e);}}
    cY = Math.max(cY, profilePicEndY);
    docInstance.setFont("times","normal"); docInstance.setTextColor(0,0,0); docInstance.setFontSize(10);
    let contactLine=[]; if(localFormData.email)contactLine.push(localFormData.email); if(localFormData.phone)contactLine.push(localFormData.phone); if(localFormData.linkedin)contactLine.push(localFormData.linkedin); if(contactLine.length>0){cY=addLineToPdfHelper(contactLine.join('  |  '),mL,cY,{},uW);} cY+=blh;
    docInstance.setFontSize(12); const today=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); cY=addLineToPdfHelper(today,mL,cY,{},uW); cY+=blh;
    if(localFormData.recipientName)cY=addLineToPdfHelper(localFormData.recipientName,mL,cY,{},uW); if(localFormData.recipientTitle)cY=addLineToPdfHelper(localFormData.recipientTitle,mL,cY,{},uW); if(localFormData.companyName)cY=addLineToPdfHelper(localFormData.companyName,mL,cY,{},uW); if(localFormData.companyAddress){const addressLines=docInstance.splitTextToSize(localFormData.companyAddress,uW); addressLines.forEach(line=>{cY=addLineToPdfHelper(line,mL,cY,{},uW);});} cY+=blh;
    cY = addBodyParagraphsHelper(letterBody, mL, cY, uW, localFormData.fullName);
    addSignatureAndNameHelper(signatureImgPreview, localFormData.fullName, mL, cY);
};
const renderSidebarInfoTemplate = (localFormData, letterBody, profilePicPreview, signatureImgPreview) => {
    const { docInstance, pdfParams } = currentPageBreakInfo;
    const { pageW, pageH, mL_orig, mR_orig, mT, mB, blh } = pdfParams;
    drawSidebarForTemplate(docInstance, pdfParams);
    const sidebarWidth = pageW * 0.30; const contentMarginLeft = sidebarWidth + 10; const contentUsableWidth = pageW - contentMarginLeft - mR_orig;
    docInstance.setTextColor(255,255,255); let sidebarCY = mT; const sidebarPadding = 10; const sidebarTextX = sidebarPadding; const sidebarContentWidth = sidebarWidth-(2*sidebarPadding); docInstance.setFont("helvetica","normal");
    if(profilePicPreview){try{const imgProps=docInstance.getImageProperties(profilePicPreview);let imgDesiredWidth=sidebarContentWidth*0.8;let imgDisplayHeight=(imgProps.height*imgDesiredWidth)/imgProps.width;if(imgDesiredWidth>sidebarContentWidth){imgDesiredWidth=sidebarContentWidth;imgDisplayHeight=(imgProps.height*imgDesiredWidth)/imgProps.width;}if(sidebarCY+imgDisplayHeight<pageH-mB){const imgX=sidebarPadding+(sidebarContentWidth-imgDesiredWidth)/2;docInstance.addImage(profilePicPreview,imgProps.fileType||'JPEG',imgX,sidebarCY,imgDesiredWidth,imgDisplayHeight);sidebarCY+=imgDisplayHeight+blh*1.5;}}catch(e){console.error("Error adding profile picture (Sidebar):",e);}}
    docInstance.setFontSize(14); docInstance.setFont("helvetica","bold");
    if(localFormData.fullName){const nameLines=docInstance.splitTextToSize(localFormData.fullName,sidebarContentWidth);nameLines.forEach(line=>{if(sidebarCY+blh<=pageH-mB){docInstance.text(line,sidebarTextX,sidebarCY);sidebarCY+=blh*1.2;}});}sidebarCY+=blh*0.5;
    docInstance.setFontSize(9); docInstance.setFont("helvetica","normal");
    const contactDetails=[localFormData.phone,localFormData.email,localFormData.linkedin,localFormData.portfolio].filter(Boolean);contactDetails.forEach(detail=>{const detailLines=docInstance.splitTextToSize(detail,sidebarContentWidth);detailLines.forEach(line=>{if(sidebarCY+blh<=pageH-mB){docInstance.text(line,sidebarTextX,sidebarCY);sidebarCY+=blh*0.9;}});sidebarCY+=blh*0.2;});sidebarCY+=blh*0.5;if(sidebarCY+blh<=pageH-mB){docInstance.setDrawColor(150,150,150);docInstance.line(sidebarPadding,sidebarCY,sidebarWidth-sidebarPadding,sidebarCY);sidebarCY+=blh;}
    let mainCY=mT;docInstance.setTextColor(0,0,0);docInstance.setFont("times","normal");docInstance.setFontSize(12);
    const today=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});mainCY=addLineToPdfHelper(today,contentMarginLeft,mainCY,{},contentUsableWidth);mainCY+=blh;
    if(localFormData.recipientName)mainCY=addLineToPdfHelper(localFormData.recipientName,contentMarginLeft,mainCY,{},contentUsableWidth);if(localFormData.recipientTitle)mainCY=addLineToPdfHelper(localFormData.recipientTitle,contentMarginLeft,mainCY,{},contentUsableWidth);if(localFormData.companyName)mainCY=addLineToPdfHelper(localFormData.companyName,contentMarginLeft,mainCY,{},contentUsableWidth);if(localFormData.companyAddress){const addressLines=docInstance.splitTextToSize(localFormData.companyAddress,contentUsableWidth);addressLines.forEach(line=>{mainCY=addLineToPdfHelper(line,contentMarginLeft,mainCY,{},contentUsableWidth);});}mainCY+=blh;
    mainCY = addBodyParagraphsHelper(letterBody, contentMarginLeft, mainCY, contentUsableWidth, localFormData.fullName);
    addSignatureAndNameHelper(signatureImgPreview, localFormData.fullName, contentMarginLeft, mainCY);
};
const renderModernMinimalistTemplate = (localFormData, letterBody, profilePicPreview, signatureImgPreview) => {
    const { docInstance, pdfParams } = currentPageBreakInfo; const { pageH, mL, mT, mB, uW, blh } = pdfParams; let cY = mT;
    docInstance.setFont("times","normal"); docInstance.setTextColor(30,30,30); docInstance.setFontSize(11);
    let profilePicEndY = cY; if(profilePicPreview){try{const imgProps=docInstance.getImageProperties(profilePicPreview);const imgDesiredWidth=25;const imgDisplayHeight=(imgProps.height*imgDesiredWidth)/imgProps.width;if(cY+imgDisplayHeight<pageH-mB){docInstance.addImage(profilePicPreview,imgProps.fileType||'JPEG',mL,cY,imgDesiredWidth,imgDisplayHeight);profilePicEndY=cY+imgDisplayHeight+blh*0.5;}}catch(e){console.error("Error adding profile picture (Minimalist):",e);}} cY=Math.max(cY,profilePicEndY);
    docInstance.setFontSize(16); docInstance.setFont("times","bold"); if(localFormData.fullName)cY=addLineToPdfHelper(localFormData.fullName,mL,cY,{},uW);
    docInstance.setFont("times","normal"); docInstance.setFontSize(10); if(localFormData.email)cY=addLineToPdfHelper(localFormData.email,mL,cY,{},uW); if(localFormData.phone)cY=addLineToPdfHelper(localFormData.phone,mL,cY,{},uW); cY+=blh*2;
    docInstance.setFontSize(11); const today=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); cY=addLineToPdfHelper(today,mL,cY,{},uW); cY+=blh;
    if(localFormData.recipientName)cY=addLineToPdfHelper(localFormData.recipientName,mL,cY,{},uW); cY+=blh;
    cY = addBodyParagraphsHelper(letterBody, mL, cY, uW, localFormData.fullName);
    addSignatureAndNameHelper(signatureImgPreview, localFormData.fullName, mL, cY);
};
const renderCreativeAccentTemplate = (localFormData, letterBody, profilePicPreview, signatureImgPreview) => {
    const { docInstance, pdfParams } = currentPageBreakInfo; const { pageW, pageH, mL, mR, mT, mB, uW, blh } = pdfParams; let cY = mT;
    docInstance.setTextColor(0,0,0); const accentColor=[200,0,0];
    let profilePicEndY=cY;if(profilePicPreview){try{const imgProps=docInstance.getImageProperties(profilePicPreview);const imgDesiredWidth=28;const imgDisplayHeight=(imgProps.height*imgDesiredWidth)/imgProps.width;const picX=pageW-mR-imgDesiredWidth;if(cY+imgDisplayHeight<pageH-mB){docInstance.addImage(profilePicPreview,imgProps.fileType||'JPEG',picX,cY,imgDesiredWidth,imgDisplayHeight);profilePicEndY=cY+imgDisplayHeight+blh*0.5;}}catch(e){console.error("Error adding profile picture (Creative):",e);}}
    docInstance.setFontSize(20); docInstance.setFont("helvetica","bold"); docInstance.setTextColor(accentColor[0],accentColor[1],accentColor[2]); if(localFormData.fullName){cY=addLineToPdfHelper(localFormData.fullName,mL,cY,{},uW);}
    cY=Math.max(cY,profilePicEndY);
    docInstance.setFont("times","normal"); docInstance.setTextColor(0,0,0); docInstance.setFontSize(12);
    let lineY=cY+blh*0.1; docInstance.setDrawColor(accentColor[0],accentColor[1],accentColor[2]); docInstance.setLineWidth(0.6); docInstance.line(mL,lineY,mL+60,lineY); docInstance.setLineWidth(0.2); docInstance.setDrawColor(0); cY+=blh*1.5;
    if(localFormData.email)cY=addLineToPdfHelper(localFormData.email,mL,cY,{},uW); cY+=blh;
    const today=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); cY=addLineToPdfHelper(today,mL,cY,{},uW); cY+=blh; if(localFormData.recipientName)cY=addLineToPdfHelper(localFormData.recipientName,mL,cY,{},uW); cY+=blh;
    cY = addBodyParagraphsHelper(letterBody, mL, cY, uW, localFormData.fullName);
    addSignatureAndNameHelper(signatureImgPreview, localFormData.fullName, mL, cY);
};


export default function CoverLetterGenerator({ token }) {
    const [formData, setFormData] = useState({
        fullName: '', email: '', phone: '', linkedin: '', portfolio: '',
        companyName: '', jobTitle: '', jobDescription: '',
        keySkills: '',
        tone: 'professional and enthusiastic',
        advertisementPlatform: '',
        recipientName: '',
        recipientTitle: '',
        companyAddress: '',
        quantifiableAchievements: '',
        specificCompanyInterest: '',
        companySpecificMention: '',
    });
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveLetter, setSaveLetter] = useState(true);

    // profilePic is set but never read
    const [profilePic, setProfilePic] = useState(null); // eslint-disable-line no-unused-vars
    const [profilePicPreview, setProfilePicPreview] = useState('');
    // signatureImg is set but never read
    const [signatureImg, setSignatureImg] = useState(null); // eslint-disable-line no-unused-vars
    const [signatureImgPreview, setSignatureImgPreview] = useState('');

    // history, showHistory, setShowHistory are used in the component, disable linting
    const [history, setHistory] = useState([]); // eslint-disable-line no-unused-vars
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false); // eslint-disable-line no-unused-vars

    // fetchHistory is a dependency
    useEffect(() => {
        if (token && showHistory) {
            fetchHistory();
        }
    }, [token, showHistory, fetchHistory]); // Added fetchHistory

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/cover-letter`, { headers: getAuthHeaders(token) });
            if (!response.ok) {
                const data = await response.json().catch(() => ({ error: "Failed to parse error from history fetch." }));
                throw new Error(data.error || `Failed to fetch history. Status: ${response.status}`);
            }
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            console.error("Error fetching cover letter history:", err);
            setError(`Could not load history: ${err.message}`);
        }
        setIsLoadingHistory(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            if (name === 'saveLetter') setSaveLetter(checked);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (name === 'profilePicUpload') {
                    setProfilePic(file);
                    setProfilePicPreview(reader.result);
                } else if (name === 'signatureImgUpload') {
                    setSignatureImg(file);
                    setSignatureImgPreview(reader.result);
                }
            };
            reader.readAsDataURL(file);
        } else {
             if (name === 'profilePicUpload') {
                setProfilePic(null);
                setProfilePicPreview('');
            } else if (name === 'signatureImgUpload') {
                setSignatureImg(null);
                setSignatureImgPreview('');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setGeneratedLetter('');
        setIsLoading(true);
        if (!formData.fullName || !formData.email || !formData.companyName || !formData.jobTitle || !formData.keySkills) {
            setError('Please fill in Full Name, Email, Company Name, Job Title, and Key Skills (marked with *).');
            setIsLoading(false); return;
        }
        try {
            const payload = { ...formData, saveLetter };
            const response = await fetch(`${API_URL}/cover-letter/generate`, {
                method: 'POST',
                headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({ error: "Failed to parse error from generation." }));
                throw new Error(data.error || `Failed to generate cover letter. Status: ${response.status}`);
            }
            const data = await response.json();
            setGeneratedLetter(data.coverLetter);
            let alertMessage = 'Cover letter generated!';
            if (data.savedLetterId && saveLetter) {
                alertMessage = 'Cover letter generated and saved!';
                // Fetch history only if showHistory is true and save was successful
                if (showHistory) {
                    fetchHistory();
                }
            }
            alert(alertMessage);
        } catch (err) { setError(err.message); console.error("Handle submit error:", err); }
        setIsLoading(false);
    };

    const handleCopyText = () => {
        if (!generatedLetter) return;
        navigator.clipboard.writeText(generatedLetter)
            .then(() => alert('Cover letter copied to clipboard!'))
            .catch(err => { console.error('Failed to copy: ', err); alert('Failed to copy.'); });
    };

    const handleDownloadTxt = () => {
        if (!generatedLetter) { alert("No letter to download."); return; }
        const filename = `${formData.companyName || 'Company'}_${formData.jobTitle || 'Job'}_CoverLetter.txt`.replace(/[^a-z0-9_.-]/gi, '_');
        const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href; link.download = filename;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(href);
    };

    const handleDownloadPdf = (templateId) => {
        if (!generatedLetter) { alert("No letter to download."); return; }
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        const localFormDataCopy = { ...formData };

        currentPageBreakInfo.docInstance = doc;
        currentPageBreakInfo.templateId = templateId;
        currentPageBreakInfo.pdfParams = {
            pageW: doc.internal.pageSize.getWidth(),
            pageH: doc.internal.pageSize.getHeight(),
            mL_orig: 20, // eslint-disable-line no-unused-vars - ESLint incorrectly flags this property definition
            mR_orig: 20,
            mT: 20,
            mB: 20,
            blh: 7,
            paraSpacing: 3.5,
        };
        // Destructure only variables used locally in the next lines
        const { mT, mB, blh } = currentPageBreakInfo.pdfParams; // Use mT, mB, blh locally. Suppress mL_orig warning on this line if it reappears unexpectedly.
        currentPageBreakInfo.pdfParams.mL = currentPageBreakInfo.pdfParams.mL_orig; // Uses mL_orig property
        currentPageBreakInfo.pdfParams.uW = currentPageBreakInfo.pdfParams.pageW - currentPageBreakInfo.pdfParams.mL_orig - currentPageBreakInfo.pdfParams.mR_orig; // Uses pageW, mL_orig, mR_orig properties
        currentPageBreakInfo.localFormDataRef = localFormDataCopy;
        currentPageBreakInfo.profilePicPreviewRef = profilePicPreview; // Pass the actual preview string


        let letterBodyToPrint = generatedLetter;
        const linesOfGeneratedLetter = generatedLetter.split('\n');
        let actualBodyStartIndex = -1;
        let accumulatedOffset = 0;
        const salutationStarters = ["dear ", "to whom it may concern", "greetings", "dear hiring manager", "dear hiring team", "dear recruitment team", "dear recruiter", "to the hiring manager", "to the recruitment team"];

        for (let i = 0; i < linesOfGeneratedLetter.length; i++) {
            const currentOriginalLine = linesOfGeneratedLetter[i];
            const trimmedLine = currentOriginalLine.trim();
            const lowerTrimmedLine = trimmedLine.toLowerCase();
            let isSalutationFlag = false;
            for (const starter of salutationStarters) {
                if (lowerTrimmedLine.startsWith(starter)) { isSalutationFlag = true; break; }
            }
            if (!isSalutationFlag && localFormDataCopy.recipientName) {
                const lowerRecipientName = localFormDataCopy.recipientName.toLowerCase();
                if (lowerTrimmedLine.startsWith(`dear ${lowerRecipientName}`)) { isSalutationFlag = true; }
                else { const recipientNameParts = lowerRecipientName.split(' '); if (recipientNameParts.length > 1) { const titleOrFirst = recipientNameParts[0]; const lastName = recipientNameParts[recipientNameParts.length - 1]; if (lowerTrimmedLine.startsWith(`dear ${titleOrFirst} ${lastName}`) || lowerTrimmedLine.startsWith(`dear ${lastName}`)) { isSalutationFlag = true; } } }
            }
            // Check if the line ends with a colon or comma, as salutations often do
             // Added parentheses to resolve the no-mixed-operators lint error
            if (isSalutationFlag && (lowerTrimmedLine.endsWith(':') || lowerTrimmedLine.endsWith(','))) {
                 actualBodyStartIndex = accumulatedOffset + currentOriginalLine.length + 1; // Start AFTER the salutation line + newline
                 break;
            }
            accumulatedOffset += currentOriginalLine.length + 1; // +1 for the newline character
        }

        if (actualBodyStartIndex !== -1) {
            letterBodyToPrint = generatedLetter.substring(actualBodyStartIndex).trimStart(); // Remove potential leading whitespace after salutation
        } else {
            console.warn("PDF: Could not find salutation ending with ':' or ','. Attempting to find body start via double newline.");
             // If no salutation found, try to find the first empty line after the potential date/address block
            const dateAddressBlockEnd = accumulatedOffset; // approximate end before body
            const bodyStartMatch = generatedLetter.substring(dateAddressBlockEnd).match(/^\s*\n\s*\n/); // Look for double newline
            if (bodyStartMatch && bodyStartMatch.index !== undefined) {
                 letterBodyToPrint = generatedLetter.substring(dateAddressBlockEnd + bodyStartMatch.index + bodyStartMatch[0].length).trimStart();
                 console.warn("PDF: Found double newline after approximate header, adjusting start index.");
            } else {
                // Fallback to using the full letter body minus the date/address block if that was found
                 if (dateAddressBlockEnd > 0) {
                     letterBodyToPrint = generatedLetter.substring(dateAddressBlockEnd).trimStart();
                 } else {
                     letterBodyToPrint = generatedLetter; // Worst case, use everything
                     console.warn("PDF: Could not find clear body start, using full generated text.");
                 }
            }
        }

        if (localFormDataCopy.companySpecificMention && localFormDataCopy.companyName) {
            const companyNameInPlaceholder = localFormDataCopy.companyName;
            // The regex to find the placeholder. Escapes companyName for regex safety.
            // eslint-disable-next-line no-useless-escape
            const placeholderRegex = new RegExp(`\\[mention something specific about ${companyNameInPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: if known from research, otherwise omit this sentence)?\\]`, "gi");
            letterBodyToPrint = letterBodyToPrint.replace(placeholderRegex, localFormDataCopy.companySpecificMention.trim());
        } else if (localFormDataCopy.companyName) {
            // If no specific mention provided, remove the placeholder
            // eslint-disable-next-line no-useless-escape
            const placeholderRegex = new RegExp(`\\[mention something specific about ${localFormDataCopy.companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: if known from research, otherwise omit this sentence)?\\]`, "gi");
            letterBodyToPrint = letterBodyToPrint.replace(placeholderRegex, "");
        }
        letterBodyToPrint = letterBodyToPrint.replace(/\s\s+/g, ' '); // Clean up extra spaces

        // Re-add salutation at the beginning of the body text to print
        // Try to find the salutation again from the original text
        const salutationMatch = generatedLetter.match(/^(.*?[:,\n])/);
         // Only re-add if we actually found a salutation line AND the body start index logic indicated the salutation was stripped
        if (salutationMatch && actualBodyStartIndex !== -1) {
             // Find the part BEFORE the calculated body start index that ends with : or ,
             const headerPart = generatedLetter.substring(0, actualBodyStartIndex);
             const lastSalutationLineMatch = headerPart.match(/.*[:,\n]/); // Find the last line ending with : or , in the header part
             if(lastSalutationLineMatch) {
                  letterBodyToPrint = lastSalutationLineMatch[0].trim() + '\n\n' + letterBodyToPrint;
                  console.log("PDF: Re-added salutation:", lastSalutationLineMatch[0].trim());
             } else {
                 console.warn("PDF: Could not find salutation pattern before calculated body start to re-add.");
             }
        } else if (actualBodyStartIndex === -1) {
             // If original body start wasn't clearly found by salutation,
             // but we potentially chopped off header info by some other means (like double newline), add a default
             const defaultSalutation = localFormDataCopy.recipientName ? `Dear ${localFormDataCopy.recipientName},` : 'Dear Hiring Manager,';
             letterBodyToPrint = defaultSalutation + '\n\n' + letterBodyToPrint;
              console.warn("PDF: Could not find original salutation, added default.");
        } else {
             console.warn("PDF: Could not find original salutation pattern to re-add (case 2).");
        }


        switch (templateId) {
            case 'classic':
                renderClassicTemplate(localFormDataCopy, letterBodyToPrint, profilePicPreview, signatureImgPreview);
                break;
            case 'headerBar':
                renderHeaderBarTemplate(localFormDataCopy, letterBodyToPrint, profilePicPreview, signatureImgPreview);
                break;
            case 'sidebarInfo':
                renderSidebarInfoTemplate(localFormDataCopy, letterBodyToPrint, profilePicPreview, signatureImgPreview);
                break;
            case 'modernMinimalist':
                renderModernMinimalistTemplate(localFormDataCopy, letterBodyToPrint, profilePicPreview, signatureImgPreview);
                break;
            case 'creativeAccent':
                renderCreativeAccentTemplate(localFormDataCopy, letterBodyToPrint, profilePicPreview, signatureImgPreview);
                break;
            default:
                console.error(`Unknown template: ${templateId}.`);
                renderClassicTemplate(localFormDataCopy, letterBodyToPrint, profilePicPreview, signatureImgPreview);
        }

        const filename = `${localFormDataCopy.companyName || 'Company'}_${localFormDataCopy.jobTitle || 'Job'}_${templateId}_CoverLetter.pdf`.replace(/[^a-z0-9_.-]/gi, '_');
        doc.save(filename);

        currentPageBreakInfo.docInstance = null;
        currentPageBreakInfo.templateId = null;
        currentPageBreakInfo.pdfParams = null;
        currentPageBreakInfo.localFormDataRef = null;
        currentPageBreakInfo.profilePicPreviewRef = null; // Clear ref
    };

    const handleSelectHistoryItem = (letter) => {
        setGeneratedLetter(letter.generatedText);
        setFormData(prev => ({
            ...prev,
            companyName: letter.companyName || '',
            jobTitle: letter.jobTitle || '',
            tone: letter.tone || 'professional and enthusiastic',
            fullName: prev.fullName,
            email: prev.email,
            phone: prev.phone,
            linkedin: prev.linkedin,
            portfolio: prev.portfolio,
            advertisementPlatform: letter.advertisementPlatform || '',
            recipientName: letter.recipientName || '',
            recipientTitle: letter.recipientTitle || '',
            companyAddress: letter.companyAddress || '',
            quantifiableAchievements: letter.quantifiableAchievements || '',
            specificCompanyInterest: letter.specificCompanyInterest || '',
            companySpecificMention: letter.companySpecificMention || '',
            jobDescription: '', // Clear job description as it's not saved
            keySkills: letter.keySkills || '', // Restore key skills
        }));
        setProfilePicPreview(''); setSignatureImgPreview(''); // History items don't save images
        setShowHistory(false); // Hide history after selecting
        const outputSection = document.getElementById('outputSection');
        if (outputSection) {
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // handleNavigateToInterviewAssistant function was listed as unused and is not present.

    if (!token) {
        return <div className={styles.container}><p className={styles.authError}>Please log in to use the Cover Letter Generator.</p></div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1><DownloadIcon /> AI Cover Letter Generator</h1>
                <p>Provide the details below to craft a personalized cover letter.</p>
            </header>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formSection}>
                    <h3>Your Information</h3>
                    <div className={styles.inputGroup}>
                        <label htmlFor="fullName">Full Name *</label>
                        <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} required placeholder="e.g., Jane Doe" />
                    </div>
                    <div className={styles.grid2Cols}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email *</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required placeholder="e.g., jane.doe@example.com" />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="phone">Phone</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} placeholder="e.g., (555) 123-4567" />
                        </div>
                    </div>
                    <div className={styles.grid2Cols}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="linkedin">LinkedIn Profile URL</label>
                            <input type="url" name="linkedin" id="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="e.g., linkedin.com/in/janedoe" />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="portfolio">Portfolio/Website URL</label>
                            <input type="url" name="portfolio" id="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="e.g., janedoe.com" />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="profilePicUpload">Profile Picture (Optional, for PDF)</label>
                        <input type="file" name="profilePicUpload" id="profilePicUpload" accept="image/png, image/jpeg" onChange={handleFileChange} className={styles.fileInput} />
                        {profilePicPreview && <img src={profilePicPreview} alt="Profile Preview" className={styles.imagePreview} />}
                    </div>
                </div>
                <div className={styles.formSection}>
                    <h3>Target Job Information</h3>
                    <div className={styles.grid2Cols}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="companyName">Company Name *</label>
                            <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required placeholder="e.g., Acme Corp" />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="jobTitle">Job Title *</label>
                            <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleChange} required placeholder="e.g., Software Engineer" />
                        </div>
                    </div>
                     <div className={styles.inputGroup}>
                        <label htmlFor="advertisementPlatform">Job Seen On (Optional)</label>
                        <input type="text" name="advertisementPlatform" id="advertisementPlatform" value={formData.advertisementPlatform} onChange={handleChange} placeholder="e.g., LinkedIn, Company Website" />
                    </div>
                    <div className={styles.grid2Cols}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="recipientName">Hiring Manager Name (Optional)</label>
                            <input type="text" name="recipientName" id="recipientName" value={formData.recipientName} onChange={handleChange} placeholder="e.g., Mr. John Smith" />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="recipientTitle">Hiring Manager Title (Optional)</label>
                            <input type="text" name="recipientTitle" id="recipientTitle" value={formData.recipientTitle} onChange={handleChange} placeholder="e.g., Engineering Manager" />
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="companyAddress">Company Address (Optional)</label>
                        <input type="text" name="companyAddress" id="companyAddress" value={formData.companyAddress} onChange={handleChange} placeholder="e.g., 123 Main St, Anytown, USA" />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="jobDescription">Job Description (Paste here - highly recommended)</label>
                        <textarea name="jobDescription" id="jobDescription" rows="6" value={formData.jobDescription} onChange={handleChange} placeholder="Paste the full job description..."></textarea>
                    </div>
                </div>
                 <div className={styles.formSection}>
                    <h3>Content Customization</h3>
                    <div className={styles.inputGroup}>
                        <label htmlFor="keySkills">Key Skills & Experiences to Highlight *</label>
                        <textarea name="keySkills" id="keySkills" rows="4" value={formData.keySkills} onChange={handleChange} placeholder="Your most relevant skills for THIS role..." required></textarea>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="quantifiableAchievements">Quantifiable Achievements (Optional)</label>
                        <textarea name="quantifiableAchievements" id="quantifiableAchievements" rows="3" value={formData.quantifiableAchievements} onChange={handleChange} placeholder="e.g., Increased sales by 20%..." />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="specificCompanyInterest">Specific Interest in THIS Company/Role (Optional)</label>
                        <textarea name="specificCompanyInterest" id="specificCompanyInterest" rows="3" value={formData.specificCompanyInterest} onChange={handleChange} placeholder="Mention their mission, values, projects..."></textarea>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="companySpecificMention">
                            Specific Company Detail (replaces placeholder like "[mention...about X company]")
                        </label>
                        <input
                            type="text"
                            name="companySpecificMention"
                            id="companySpecificMention"
                            value={formData.companySpecificMention}
                            onChange={handleChange}
                            placeholder="e.g., Their recent work on Project Y"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="tone">Tone of the Letter</label>
                        <select name="tone" id="tone" value={formData.tone} onChange={handleChange} className={styles.selectInput}>
                            <option value="professional and enthusiastic">Professional & Enthusiastic</option>
                            <option value="formal and direct">Formal & Direct</option>
                            <option value="creative and engaging">Creative & Engaging</option>
                            <option value="concise and impactful">Concise & Impactful</option>
                        </select>
                    </div>
                </div>
                <div className={styles.formSection}>
                    <h3>Signature (Optional, for PDF ending)</h3>
                    <div className={styles.inputGroup}>
                        <label htmlFor="signatureImgUpload">Signature Image (e.g., PNG with transparent background)</label>
                        <input type="file" name="signatureImgUpload" id="signatureImgUpload" accept="image/png, image/jpeg" onChange={handleFileChange} className={styles.fileInput} />
                        {signatureImgPreview && <img src={signatureImgPreview} alt="Signature Preview" className={styles.imagePreviewSignature} />}
                    </div>
                </div>

                <div className={styles.inputGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" name="saveLetter" id="saveLetter" checked={saveLetter} onChange={handleChange} className={styles.checkboxInput}/>
                    <label htmlFor="saveLetter" style={{ marginBottom: 0, fontWeight: 'normal', cursor: 'pointer' }}> Save this cover letter to my history</label>
                </div>
                <button type="submit" disabled={isLoading} className={styles.actionButton}> {isLoading ? <LoadingSpinner /> : '✨ Generate Cover Letter'} </button>
                {error && !isLoading && <p className={styles.errorMessage}>{error}</p>}
            </form>

            {generatedLetter && (
                <>
                    <section id="outputSection" className={styles.outputSection}>
                        <h2>Your Generated Cover Letter:</h2>
                        <textarea value={generatedLetter} readOnly rows="15" className={styles.outputTextarea}></textarea>
                        <div className={styles.outputActions}>
                            <button onClick={handleCopyText} className={styles.utilityButton}><CopyIcon/> Copy Text</button>
                            <button onClick={handleDownloadTxt} className={styles.utilityButton}><DownloadIcon /> Download .txt</button>
                        </div>
                    </section>

                    <section className={styles.templatePreviewSection}>
                        <h3>Download PDF with a Template:</h3>
                        <div className={styles.templatePreviewsContainer}>
                            {[
                                { id: 'classic', name: 'Classic (Times)', previewStyle: styles.classicPreview },
                                { id: 'headerBar', name: 'Header Bar (Times)', previewStyle: styles.headerBarPreview },
                                { id: 'sidebarInfo', name: 'Sidebar (Times Body)', previewStyle: styles.sidebarInfoPreview },
                                { id: 'modernMinimalist', name: 'Minimalist (Times)', previewStyle: styles.modernMinimalistPreview },
                                { id: 'creativeAccent', name: 'Creative (Times Body)', previewStyle: styles.creativeAccentPreview },
                            ].map(template => (
                                <div key={template.id} className={styles.templatePreviewItem} onClick={() => handleDownloadPdf(template.id)}>
                                    <div className={`${styles.templatePreviewImage} ${template.previewStyle}`}>
                                        <span>{template.name}</span>
                                    </div>
                                    <button className={styles.downloadTemplateButton}>Download {template.name}</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}
            <section className={styles.historySection}>
                <button onClick={() => setShowHistory(prev => !prev)} className={styles.historyToggleButton}>
                    <HistoryIcon /> {showHistory ? 'Hide' : 'Show'} Cover Letter History ({history.length})
                </button>
                {showHistory && ( <div className={styles.historyList}>
                    {isLoadingHistory && <p className={styles.loadingText}><LoadingSpinner/> Loading history...</p>}
                    {!isLoadingHistory && error && <p className={styles.errorMessage}>{error}</p>}
                    {!isLoadingHistory && !error && history.length === 0 && <p className={styles.noItemsText}>No saved cover letters found.</p>}
                    {!isLoadingHistory && !error && history.length > 0 && history.map(item => (
                        <div key={item._id} className={styles.historyItem} onClick={() => handleSelectHistoryItem(item)}>
                            <h4>{item.jobTitle} at {item.companyName}</h4>
                            <p>Generated: {new Date(item.createdAt).toLocaleDateString()}</p>
                            <p className={styles.historyPreview}>{item.generatedText ? item.generatedText.substring(0, 120) + "..." : "No preview available."}</p>
                        </div>
                    ))}
                </div>)}
            </section>
        </div>
    );
}