from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class Judge(BaseModel):
    name: str
    division: str

class Document(BaseModel):
    item: str
    rule: str
    link: str

class Rule(BaseModel):
    name: str
    text: str
    link: str

class ChecklistItem(BaseModel):
    phase: str
    task: str
    notes: str
    rule: str
    link: str

class SearchResults(BaseModel):
    documents: List[Document]
    conditional: List[Document]
    rules: List[Rule]
    checklist: List[ChecklistItem]

class DocketRequest(BaseModel):
    state: str
    county: str
    division: str
    judge: str
    document_type: str

# Mock data
JUDGES = [
    {"name": "Charles F. Adams", "division": "Complex Civil Litigation"},
    {"name": "Carol Overton", "division": "Complex Civil Litigation"},
    {"name": "Panteha E. Saban", "division": "Civil Division"},
    {"name": "Lori E. Pegg", "division": "Civil Division"},
    {"name": "JoAnne McCracken", "division": "Civil Division"},
    {"name": "Julia Alloggiamento", "division": "Civil Division"},
]

MOCK_DB = {
    "Motion for Summary Judgment": {
        "Charles F. Adams": {
            "documents": [
                {
                    "item": "Notice of Motion and Motion",
                    "rule": "CCP § 437c(a), CRC Rule 3.1350(b)",
                    "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c",
                },
                {
                    "item": "Memorandum of Points and Authorities",
                    "rule": "Limit: 20 pages [CRC Rule 3.1113(d)]",
                    "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1113",
                },
                {
                    "item": "Separate Statement of Undisputed Material Facts",
                    "rule": "MANDATORY [CCP § 437c(b)(1), CRC Rule 3.1350(d)]",
                    "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350",
                },
            ],
            "conditional": [
                {
                    "item": "Request for Judicial Notice (RJN)",
                    "rule": "If relying on public records. [Evid. Code §§ 451, 452]",
                    "link": "https://leginfo.legislature.ca.gov/faces/sections_search.xhtml?sectionNum=451&lawCode=EVID",
                },
                {
                    "item": "Proposed Judgment",
                    "rule": "If MSJ is dispositive of entire case. [CRC Rule 3.1312]",
                    "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1312",
                },
            ],
            "rules": [
                {
                    "name": "Governing Statute",
                    "text": "CCP § 437c is the comprehensive law for MSJs, setting the 75-day notice period and mandating the Separate Statement.",
                    "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=437c",
                },
                {
                    "name": "Formatting and Structure",
                    "text": "CRC Rule 3.1350 dictates the specific two-column format for the Separate Statement and sets the 20-page limit for the legal brief.",
                    "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350",
                },
            ],
            "checklist": [
                {
                    "phase": "Pre-Filing",
                    "task": "Reserve Hearing Date (CRS)",
                    "notes": "Must be at least 75 calendar days out, plus time for service.",
                    "rule": "[Local Protocol]",
                    "link": "#",
                },
                {
                    "phase": "Pre-Filing",
                    "task": "Review Judge Adams's Standing Orders",
                    "notes": "Check the court's website under his department directory.",
                    "rule": "[Judge Directory]",
                    "link": "https://www.scscourt.org/divisions/civil/judges.shtml",
                },
                {
                    "phase": "Drafting",
                    "task": "Draft Notice of Motion & Motion",
                    "notes": "Include hearing date, time, and department.",
                    "rule": "CCP § 1010",
                    "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010",
                },
                {
                    "phase": "Drafting",
                    "task": "Draft Separate Statement",
                    "notes": "Use two-column format. Do not include argument.",
                    "rule": "CRC 3.1350(h)",
                    "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350",
                },
                {
                    "phase": "Filing & Service",
                    "task": "File Documents with Court",
                    "notes": "E-file via the court's portal.",
                    "rule": "[Local Rules]",
                    "link": "#",
                },
                {
                    "phase": "Filing & Service",
                    "task": "Serve All Parties",
                    "notes": "Serve via method agreed upon by parties (e-service typical).",
                    "rule": "CCP § 1010.6",
                    "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1010.6",
                },
            ],
        },
    },
}

@app.get("/")
async def root():
    print("Hello from FastAPI!")
    return {"message": "Hello from FastAPI!"}

@app.get("/api/hello")
async def hello():
    print("Hello from FastAPI endpoint!")
    return {"message": "Hello from FastAPI endpoint!"} 

@app.get("/api/judges")
async def get_judges():
    """Get all available judges"""
    return {"judges": JUDGES}

@app.post("/api/prepareDocket")
async def prepare_docket(request: DocketRequest):
    """Prepare filing docket based on search parameters"""
    print(f"Preparing docket for: {request}")
    
    # Look up the data based on document type and judge
    data = MOCK_DB.get(request.document_type, {}).get(request.judge)
    
    if not data:
        return {"error": "No data found for the specified parameters"}, 404
    
    return {
        "success": True,
        "data": data,
        "request_params": {
            "state": request.state,
            "county": request.county,
            "division": request.division,
            "judge": request.judge,
            "document_type": request.document_type
        }
    } 