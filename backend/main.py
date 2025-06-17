from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import base64
from document_factory import DocumentShellFactory
from document_utils import DocumentConverter

app = FastAPI(title="Ingrid Legal API", version="1.0.0")

# Add CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://ingrid.legal"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class PrepareDocketRequest(BaseModel):
    state: str
    county: str
    division: str
    judge: str
    document_type: str

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

class PrepareDocketResponse(BaseModel):
    success: bool
    data: Dict[str, Any]
    request_params: Dict[str, str]
    document_bytes: Optional[str] = None  # Base64 encoded document bytes

# Hardcoded database - Legal document requirements by jurisdiction
LEGAL_DATABASE = {
    ("California", "Santa Clara", "Complex Civil Litigation", "Charles F. Adams", "Motion for Summary Judgment"): {
        "documents": [
            {
                "item": "Notice of Motion and Motion for Summary Judgment",
                "rule": "CCP § 437c; CRC Rule 3.1350",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "item": "Separate Statement of Undisputed Material Facts",
                "rule": "CRC Rule 3.1350(d)(2)",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350"
            },
            {
                "item": "Supporting Memorandum of Points and Authorities",
                "rule": "CCP § 437c(b)(1); CRC Rule 3.1113",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "item": "Declaration(s) in Support",
                "rule": "CCP § 437c(b)(1)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "item": "Proposed Order",
                "rule": "CRC Rule 3.1312",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1312"
            }
        ],
        "conditional": [
            {
                "item": "Request for Judicial Notice",
                "rule": "Required if seeking judicial notice [Evidence Code § 452]",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=452&lawCode=EVID"
            },
            {
                "item": "Expert Declaration",
                "rule": "Required if motion relies on expert opinion [CCP § 437c(d)]",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "item": "Discovery Sanctions Motion",
                "rule": "Required if opposing party failed to respond to discovery [CCP § 437c(f)(2)]",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            }
        ],
        "rules": [
            {
                "name": "Notice Requirements",
                "text": "Motion must be served and filed at least 75 days before the time appointed for hearing. If served by mail, service must be at least 80 days before hearing.",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "name": "Page Limitations",
                "text": "Memorandum of points and authorities may not exceed 20 pages. Separate statement is not subject to page limitations but must comply with formatting requirements.",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1113"
            },
            {
                "name": "Separate Statement Format",
                "text": "Must be in two-column format with undisputed facts in left column and evidence supporting each fact in right column. Each fact must be numbered.",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350"
            },
            {
                "name": "Judge Adams Standing Order",
                "text": "Judge Adams requires courtesy copies of all motions to be delivered to chambers by 4:00 PM the court day before the hearing. Electronic copies must be in searchable PDF format.",
                "link": "http://www.scscourt.org/court_divisions/civil/civil_complex.shtml"
            }
        ],
        "checklist": [
            {
                "phase": "Pre-Filing",
                "task": "Conduct meet and confer regarding discovery disputes",
                "notes": "Must make good faith effort to resolve discovery disputes before filing motion",
                "rule": "CCP § 437c(f)(2)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "phase": "Pre-Filing",
                "task": "Calculate proper notice period",
                "notes": "75 days if personal service, 80 days if mail service. Count backwards from hearing date.",
                "rule": "CCP § 437c(a)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "phase": "Drafting",
                "task": "Prepare Notice of Motion",
                "notes": "Must state specific relief sought and hearing date/time/location",
                "rule": "CCP § 1010; CRC Rule 3.1110",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1110"
            },
            {
                "phase": "Drafting",
                "task": "Draft Separate Statement in required format",
                "notes": "Use two-column format, number each fact, cite to specific evidence",
                "rule": "CRC Rule 3.1350(d)(2)",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350"
            },
            {
                "phase": "Drafting",
                "task": "Prepare supporting declarations",
                "notes": "Must be based on personal knowledge, attach relevant exhibits",
                "rule": "CCP § 2015.5",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=2015.5&lawCode=CCP"
            },
            {
                "phase": "Filing",
                "task": "File and serve motion papers",
                "notes": "File with court and serve all parties by deadline",
                "rule": "CCP § 437c(a)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "phase": "Filing",
                "task": "Deliver courtesy copies to Judge Adams chambers",
                "notes": "Required by 4:00 PM the court day before hearing. Include electronic searchable PDF.",
                "rule": "Judge Adams Standing Order",
                "link": "http://www.scscourt.org/court_divisions/civil/civil_complex.shtml"
            },
            {
                "phase": "Post-Filing",
                "task": "Monitor for opposition papers",
                "notes": "Opposition due 14 days before hearing. Prepare reply if necessary.",
                "rule": "CCP § 437c(b)(2)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "phase": "Post-Filing",
                "task": "Prepare reply papers if needed",
                "notes": "Reply due 5 days before hearing. Address new arguments raised in opposition.",
                "rule": "CCP § 437c(b)(3)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            }
        ]
    },
    ("California", "Santa Clara", "Complex Civil Litigation", "Carol Overton", "Motion for Summary Judgment"): {
        "documents": [
            {
                "item": "Notice of Motion and Motion for Summary Judgment",
                "rule": "CCP § 437c; CRC Rule 3.1350",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "item": "Separate Statement of Undisputed Material Facts",
                "rule": "CRC Rule 3.1350(d)(2)",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1350"
            },
            {
                "item": "Supporting Memorandum of Points and Authorities",
                "rule": "CCP § 437c(b)(1); CRC Rule 3.1113",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "item": "Declaration(s) in Support",
                "rule": "CCP § 437c(b)(1)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "item": "Proposed Order",
                "rule": "CRC Rule 3.1312",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1312"
            }
        ],
        "conditional": [
            {
                "item": "Request for Judicial Notice",
                "rule": "Required if seeking judicial notice [Evidence Code § 452]",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=452&lawCode=EVID"
            }
        ],
        "rules": [
            {
                "name": "Notice Requirements",
                "text": "Motion must be served and filed at least 75 days before the time appointed for hearing. If served by mail, service must be at least 80 days before hearing.",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            },
            {
                "name": "Judge Overton Case Management",
                "text": "Judge Overton requires all summary judgment motions to be heard on designated law and motion days. Contact department for available dates.",
                "link": "http://www.scscourt.org/court_divisions/civil/civil_complex.shtml"
            }
        ],
        "checklist": [
            {
                "phase": "Pre-Filing",
                "task": "Schedule hearing date with Judge Overton's department",
                "notes": "Must coordinate with court calendar for designated motion days",
                "rule": "Judge Overton Standing Order",
                "link": "http://www.scscourt.org/court_divisions/civil/civil_complex.shtml"
            },
            {
                "phase": "Filing",
                "task": "File and serve motion papers",
                "notes": "File with court and serve all parties by deadline",
                "rule": "CCP § 437c(a)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=437c&lawCode=CCP"
            }
        ]
    },
    # Add more entries for different combinations as needed
    ("California", "Santa Clara", "Civil Division", "Panteha E. Saban", "Motion to Dismiss (Demurrer)"): {
        "documents": [
            {
                "item": "Notice of Demurrer",
                "rule": "CCP § 430.10; CRC Rule 3.1320",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=430.10&lawCode=CCP"
            },
            {
                "item": "Demurrer",
                "rule": "CCP § 430.10",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=430.10&lawCode=CCP"
            },
            {
                "item": "Memorandum of Points and Authorities",
                "rule": "CRC Rule 3.1113",
                "link": "https://www.courts.ca.gov/cms/rules/index.cfm?title=three&linkid=rule3_1113"
            }
        ],
        "conditional": [
            {
                "item": "Request for Judicial Notice",
                "rule": "Required if demurrer relies on judicially noticeable facts [Evidence Code § 452]",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=452&lawCode=EVID"
            }
        ],
        "rules": [
            {
                "name": "Notice Requirements",
                "text": "Demurrer must be served and filed at least 16 court days before the hearing date.",
                "rule": "CCP § 1005(b)",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1005&lawCode=CCP"
            }
        ],
        "checklist": [
            {
                "phase": "Pre-Filing",
                "task": "Meet and confer before filing demurrer",
                "notes": "Must attempt to meet and confer in person, by telephone, or by letter",
                "rule": "CCP § 430.41",
                "link": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=430.41&lawCode=CCP"
            }
        ]
    }
}

@app.get("/")
async def root():
    return {"message": "Ingrid Legal API is running"}


@app.post("/api/prepareDocket", response_model=PrepareDocketResponse)
async def prepare_docket(request: PrepareDocketRequest):
    """
    Prepare legal docket based on jurisdiction, judge, and document type
    """
    try:
        # Create lookup key
        lookup_key = (
            request.state,
            request.county,
            request.division,
            request.judge,
            request.document_type
        )
        
        # Look up data in hardcoded database
        if lookup_key in LEGAL_DATABASE:
            data = LEGAL_DATABASE[lookup_key]
        else:
            # Provide generic fallback data if specific combination not found
            data = {
                "documents": [
                    {
                        "item": f"Notice of Motion and {request.document_type}",
                        "rule": "Local court rules apply",
                        "link": "https://www.courts.ca.gov/"
                    }
                ],
                "conditional": [
                    {
                        "item": "Request for Judicial Notice",
                        "rule": "Required if seeking judicial notice",
                        "link": "https://www.courts.ca.gov/"
                    }
                ],
                "rules": [
                    {
                        "name": "General Filing Requirements",
                        "text": "Please consult local court rules for specific requirements in this jurisdiction.",
                        "link": "https://www.courts.ca.gov/"
                    }
                ],
                "checklist": [
                    {
                        "phase": "Pre-Filing",
                        "task": "Review local court rules",
                        "notes": "Check specific requirements for this court and document type",
                        "rule": "Local Rules",
                        "link": "https://www.courts.ca.gov/"
                    }
                ]
            }
        
        # Generate document using factory
        builder = DocumentShellFactory.create_document_shell(
            document_type=request.document_type,
            case_info={
                'plaintiff': '[PLAINTIFF NAME]',
                'defendant': '[DEFENDANT NAME]',
                'case_number': '[CASE NUMBER]',
                'court': f"{request.county} County Superior Court",
                'judge': request.judge
            },
            rules=data['rules'],
            documents=data['documents']
        )
        
        # Generate document and convert to base64
        document = builder.render()
        document_base64 = DocumentConverter.to_base64(document)
        
        return PrepareDocketResponse(
            success=True,
            data=data,
            request_params={
                "state": request.state,
                "county": request.county,
                "division": request.division,
                "judge": request.judge,
                "document_type": request.document_type
            },
            document_bytes=document_base64
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to prepare docket: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)