from typing import Dict, Any, List
from document_builder import (
    LegalDocumentBuilder, 
    MotionForSummaryJudgmentBuilder, 
    SeparateStatementBuilder, 
    DemurrerBuilder
)

class DocumentShellFactory:
    """
    Factory class for creating legal document shells based on document type and court rules
    """
    
    @staticmethod
    def create_document_shell(
        document_type: str,
        case_info: Dict[str, str],
        rules: List[Dict[str, Any]],
        documents: List[Dict[str, str]]
    ) -> LegalDocumentBuilder:
        """
        Create a document shell based on document type and applicable rules
        
        Args:
            document_type: Type of legal document (e.g., "Motion for Summary Judgment")
            case_info: Dictionary with plaintiff, defendant, case_number, court, judge
            rules: List of applicable court rules from database
            documents: List of required documents from database
            
        Returns:
            Configured LegalDocumentBuilder instance
        """
        
        # Determine builder type based on document type
        builder = DocumentShellFactory._get_builder_for_document_type(document_type)
        
        # Set case information
        builder.set_case_info(
            plaintiff=case_info.get('plaintiff', '[PLAINTIFF NAME]'),
            defendant=case_info.get('defendant', '[DEFENDANT NAME]'),
            case_number=case_info.get('case_number', '[CASE NUMBER]'),
            court=case_info.get('court', '[COURT NAME]'),
            document_type=document_type,
            judge=case_info.get('judge', '')
        )
        
        # Add court rules for formatting guidance
        builder.add_court_rules(rules)
        
        # Configure document based on type and rules
        DocumentShellFactory._configure_document_specific_settings(
            builder, document_type, rules, documents
        )
        
        return builder
    
    @staticmethod
    def _get_builder_for_document_type(document_type: str) -> LegalDocumentBuilder:
        """Get appropriate builder class for document type"""
        doc_type_lower = document_type.lower()
        
        if 'summary judgment' in doc_type_lower:
            return MotionForSummaryJudgmentBuilder()
        elif 'separate statement' in doc_type_lower:
            return SeparateStatementBuilder()
        elif 'demurrer' in doc_type_lower or 'dismiss' in doc_type_lower:
            return DemurrerBuilder()
        else:
            # Default to generic builder
            return LegalDocumentBuilder()
    
    @staticmethod
    def _configure_document_specific_settings(
        builder: LegalDocumentBuilder,
        document_type: str,
        rules: List[Dict[str, Any]],
        documents: List[Dict[str, str]]
    ):
        """Configure document-specific settings based on rules and requirements"""
        
        doc_type_lower = document_type.lower()
        
        # Configure based on document type
        if 'summary judgment' in doc_type_lower:
            DocumentShellFactory._configure_summary_judgment_motion(builder, rules, documents)
        elif 'separate statement' in doc_type_lower:
            DocumentShellFactory._configure_separate_statement(builder, rules)
        elif 'demurrer' in doc_type_lower:
            DocumentShellFactory._configure_demurrer(builder, rules)
        else:
            # Generic configuration
            builder.add_section("INTRODUCTION", lines_count=15, include_intro_note=True)
            builder.add_section("ARGUMENT", lines_count=30, include_intro_note=True)
            builder.add_section("CONCLUSION", lines_count=8, include_intro_note=True)
    
    @staticmethod
    def _configure_summary_judgment_motion(
        builder: MotionForSummaryJudgmentBuilder,
        rules: List[Dict[str, Any]],
        documents: List[Dict[str, str]]
    ):
        """Configure motion for summary judgment specific settings"""
        
        # Check if separate statement is required
        separate_statement_required = any(
            'separate statement' in doc.get('item', '').lower() 
            for doc in documents
        )
        
        # Configure standard sections
        builder.configure_standard_sections()
        
        # Parse rules for specific requirements
        for rule in rules:
            rule_text = rule.get('text', '').lower()
            rule_name = rule.get('name', '').lower()
            
            # Page limitations
            if 'page limit' in rule_name or 'may not exceed' in rule_text:
                import re
                page_match = re.search(r'(\d+)\s*page', rule_text)
                if page_match:
                    max_pages = int(page_match.group(1))
                    builder.set_page_count(min(max_pages, 20))  # Cap at reasonable limit
            
            # Special judge requirements
            if 'courtesy cop' in rule_text or 'deliver' in rule_text:
                # Add note about courtesy copy requirements
                builder.add_section(
                    "FILING INSTRUCTIONS", 
                    lines_count=5, 
                    include_intro_note=True
                )
    
    @staticmethod
    def _configure_separate_statement(
        builder: SeparateStatementBuilder,
        rules: List[Dict[str, Any]]
    ):
        """Configure separate statement specific settings"""
        builder.configure_two_column_format()
        
        # Apply formatting rules
        for rule in rules:
            rule_text = rule.get('text', '').lower()
            if 'two-column' in rule_text:
                # Already configured for two-column
                pass
            elif 'numbered' in rule_text:
                # Ensure facts are numbered (handled in builder)
                pass
    
    @staticmethod
    def _configure_demurrer(
        builder: DemurrerBuilder,
        rules: List[Dict[str, Any]]
    ):
        """Configure demurrer specific settings"""
        builder.configure_standard_sections()
        
        # Check for meet and confer requirements
        meet_confer_required = any(
            'meet and confer' in rule.get('text', '').lower()
            for rule in rules
        )
        
        if meet_confer_required:
            builder.add_section(
                "MEET AND CONFER DECLARATION",
                lines_count=10,
                include_intro_note=True
            )

class DocumentTypeMapper:
    """Maps frontend document types to internal document types"""
    
    DOCUMENT_TYPE_MAPPING = {
        "Motion for Summary Judgment": "Motion for Summary Judgment",
        "Motion to Dismiss (Demurrer)": "Demurrer",
        "Motion to Compel Further Discovery Responses": "Motion to Compel",
        "Motion to Strike": "Motion to Strike",
        "Answer": "Answer",
        "Complaint": "Complaint"
    }
    
    @staticmethod
    def get_internal_document_type(frontend_type: str) -> str:
        """Convert frontend document type to internal type"""
        return DocumentTypeMapper.DOCUMENT_TYPE_MAPPING.get(
            frontend_type, 
            frontend_type
        )
    
    @staticmethod
    def requires_separate_statement(document_type: str) -> bool:
        """Check if document type requires a separate statement"""
        return "Motion for Summary Judgment" in document_type