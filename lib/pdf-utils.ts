export async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Base64データからバッファに変換
    const base64Content = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    
    // pdf2jsonを使用
    const PDFParser = (await import('pdf2json')).default;
    
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF Parse Error:', errData.parserError);
        reject(new Error('PDFファイルの解析に失敗しました'));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          let text = '';
          
          // ページごとにテキストを抽出
          if (pdfData.Pages) {
            pdfData.Pages.forEach((page: any) => {
              if (page.Texts) {
                page.Texts.forEach((textItem: any) => {
                  if (textItem.R) {
                    textItem.R.forEach((r: any) => {
                      if (r.T) {
                        // URLデコードしてテキストを取得
                        text += decodeURIComponent(r.T) + ' ';
                      }
                    });
                  }
                });
                text += '\n';
              }
            });
          }
          
          resolve(text.trim());
        } catch (error) {
          console.error('Text extraction error:', error);
          reject(new Error('PDFからテキストの抽出に失敗しました'));
        }
      });
      
      // バッファからPDFを解析
      pdfParser.parseBuffer(buffer);
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('PDFファイルの読み取りに失敗しました');
  }
}