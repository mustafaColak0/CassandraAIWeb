from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crewai import Agent, Task, Crew, LLM
import os
from fpdf import FPDF

# PDF raporu oluşturma fonksiyonu
def create_pdf_report(text):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    clean_text = text.encode('ascii', 'ignore').decode('ascii')
    pdf.multi_cell(0, 10, txt=clean_text)
    return pdf.output(dest='S').encode('latin-1')

app = FastAPI()
# CORS ayarları, frontend'in farklı bir porttan gelmesi durumunda sorun yaşamamak için.   
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# İstek yapısı için Pydantic modeli
class AnalysisRequest(BaseModel):
    sector: str
    type: str
    userApiKey: str  # Frontend'den gelecek API anahtarını buraya ekledik
# Anahtar kontrolü, her istek atan kullanıcı kendi 'userApiKey'sini sisteme besleyecek. 
# Bu sayede her kullanıcı kendi API anahtarıyla analiz yapabilecek ve güvenlik sağlanmış olacak.
@app.post("/analyze")
async def analyze(request: AnalysisRequest):
    # Anahtar kontrolü
    if not request.userApiKey or request.userApiKey.strip() == "":
        raise HTTPException(status_code=400, detail="Lütfen geçerli bir Groq API Key yollayın usta! 🔑")

    try:
        # Her istek atan kullanıcı kendi 'userApiKey'sini sisteme besleyecek.
        dynamic_llm = LLM(
            model="llama-3.2-90b-vision",
            api_key=request.userApiKey,
            temperature=0.2
        )

        # Ajanı dinamik LLM ile bağlıyoruz
        analyst = Agent(
            role='Kırmızı Takım Uzmanı',
            goal=f'{request.sector} içindeki {request.type} zafiyetini analiz et.',
            backstory='Siber güvenlik konusunda uzmanlaşmış stratejik bir yapay zeka.',
            llm=dynamic_llm,
            verbose=True
        )

        task = Task(
            description=f'Senaryo: {request.sector} - {request.type}. Bu vaka için sızma testi adımlarını ve çözüm önerilerini içeren bir rapor hazırla.',
            agent=analyst,
            expected_output='Teknik detaylar ve çözüm yollarını içeren profesyonel analiz raporu.'
        )

        crew = Crew(agents=[analyst], tasks=[task])
        result = crew.kickoff()
        
        return {"status": "success", "result": str(result)}
    
    except Exception as e:
        print(f"MOTOR ÇÖKTÜ: {str(e)}") 
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)