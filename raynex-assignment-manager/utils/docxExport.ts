import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  SectionType,
  VerticalAlign,
  ShadingType,
  ImageRun,
  UnderlineType,
} from 'docx';
import FileSaver from 'file-saver';
import { AssignmentData } from '../types';

const saveAs = (FileSaver as any).saveAs || FileSaver;

const base64ToUint8Array = (base64: string) => {
  try {
      if (!base64 || !base64.includes(',')) return new Uint8Array(0);
      const binaryString = window.atob(base64.split(',')[1]);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  } catch(e) {
      console.warn("Base64 decode failed, skipping image", e);
      return new Uint8Array(0);
  }
};

const processNode = (node: Node, styles: { bold?: boolean, italic?: boolean, underline?: boolean, color?: string, size?: number } = {}): any[] => {
  const children: any[] = [];
  
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent?.trim() || node.textContent === " ") {
      children.push(new TextRun({
        text: node.textContent,
        font: "Inter",
        size: styles.size || 24, 
        bold: styles.bold,
        italics: styles.italic,
        underline: styles.underline ? { type: UnderlineType.SINGLE } : undefined,
        color: styles.color || "000000",
      }));
    }
    return children;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    if (tagName === 'img') {
        const src = (el as HTMLImageElement).src;
        if (src && src.startsWith('data:image')) {
            const imgData = base64ToUint8Array(src);
            if (imgData.length > 0) {
                children.push(new ImageRun({
                    data: imgData,
                    transformation: {
                        width: Math.min((el as HTMLImageElement).width || 400, 600),
                        height: Math.min((el as HTMLImageElement).height || 300, 600),
                    },
                }));
            }
        }
        return children;
    }
    
    if (tagName === 'br') {
        children.push(new TextRun({ text: "", break: 1 }));
        return children;
    }

    if (tagName === 'table') {
        // Basic table support for simple grids
        // Ideally needs recursive table parser, but simple placeholder for now
        // This prevents crash if user inserted HTML table
        return [];
    }

    const newStyles = { ...styles };
    if (tagName === 'b' || tagName === 'strong' || el.style.fontWeight === 'bold') newStyles.bold = true;
    if (tagName === 'i' || tagName === 'em' || el.style.fontStyle === 'italic') newStyles.italic = true;
    if (tagName === 'u' || el.style.textDecoration.includes('underline')) newStyles.underline = true;
    if (el.innerText && el.innerText.trim().startsWith("Q.")) { newStyles.bold = true; newStyles.size = 28; } // 14pt = 28 half-points
    if (el.innerText && el.innerText.trim().startsWith("Ans:")) { newStyles.bold = true; }

    el.childNodes.forEach(child => {
       children.push(...processNode(child, newStyles));
    });
  }

  return children;
};

const htmlToDocxParagraphs = (html: string): Paragraph[] => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const paragraphs: Paragraph[] = [];
  
  const processBlock = (block: HTMLElement | Node) => {
     const runs = processNode(block);
     if (runs.length > 0) {
        paragraphs.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: runs
        }));
     }
  };

  if (tempDiv.childNodes.length === 0) {
      paragraphs.push(new Paragraph(""));
  } else {
      tempDiv.childNodes.forEach(node => {
         if (node.nodeType === Node.ELEMENT_NODE && ['div', 'p', 'h1', 'h2', 'h3'].includes((node as HTMLElement).tagName.toLowerCase())) {
             processBlock(node);
         } else if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) {
         } else {
             processBlock(node);
         }
      });
  }

  return paragraphs;
};

export const exportToDocx = async (data: AssignmentData) => {
  const tableBorder = { style: BorderStyle.SINGLE, size: 4, color: "D97706" };
  const blueLabelFill = { type: ShadingType.CLEAR, fill: "BFDBFE" };
  const blueValueFill = { type: ShadingType.CLEAR, fill: "DBEAFE" };

  const createRow = (label: string, value: string) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: blueLabelFill,
          borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "Inter" })], alignment: AlignmentType.CENTER })],
          verticalAlign: VerticalAlign.CENTER,
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          shading: blueValueFill,
          borders: { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder },
          children: [new Paragraph({ children: [new TextRun({ text: value || " ", font: "Inter" })], alignment: AlignmentType.CENTER })],
          verticalAlign: VerticalAlign.CENTER,
        }),
      ],
    });
  };

  const coverTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createRow("Submitted By:", data.studentName),
      createRow("Student I.D:", data.studentID),
      createRow("Course:", `${data.courseName} (${data.courseCode})`),
      createRow("Submitted To:", data.teacherName || ""),
      createRow("Date:", data.submissionDate || "Spring 2025"),
      ...(data.coverRows || []).map(row => createRow(row.label || "Extra", row.value || ""))
    ],
  });

  const contentChildren: Paragraph[] = [];
  data.contentPages.forEach((pageHtml, index) => {
     if (index > 0) {
        contentChildren.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })], pageBreakBefore: true }));
     }
     contentChildren.push(...htmlToDocxParagraphs(pageHtml));
  });

  const borderColor = (data.borderColor || '#16A34A').replace('#', '');
  const greenDoubleBorder = { style: BorderStyle.DOUBLE, size: 24, space: 15, color: borderColor };

  const doc = new Document({
    sections: [
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: { top: 700, right: 700, bottom: 700, left: 700 }, 
            borders: {
                pageBorderTop: greenDoubleBorder,
                pageBorderBottom: greenDoubleBorder,
                pageBorderLeft: greenDoubleBorder,
                pageBorderRight: greenDoubleBorder,
            }
          }
        },
        children: [
           new Paragraph({
             spacing: { after: 2000 },
             children: [] 
           }),
           new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
                 new TextRun({
                     text: "●", 
                     size: 200, 
                     color: "4ADE80", 
                 })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: data.universityName || "RAYNEX UNIVERSITY",
                bold: true,
                size: 48,
                font: "Inter",
                underline: { type: "single", color: "16A34A" }
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 1200 }, children: [] }), 
          
          coverTable,
        ],
      },
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: { top: 700, right: 700, bottom: 700, left: 700 }, 
            borders: {
                pageBorderTop: greenDoubleBorder,
                pageBorderBottom: greenDoubleBorder,
                pageBorderLeft: greenDoubleBorder,
                pageBorderRight: greenDoubleBorder,
            }
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Assignment: ${data.number}`,
                    bold: true,
                    size: 28,
                    font: "Inter",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    size: 20,
                    font: "Inter"
                  }),
                ],
              }),
            ],
          }),
        },
        children: contentChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.name.replace(/\s+/g, '_')}_Assignment.docx`);
};