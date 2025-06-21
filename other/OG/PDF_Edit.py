# This Python script demonstrates how Ingrid would pre-populate the
# CM-010 Civil Case Cover Sheet. It uses the `pypdf` library, which
# is a standard tool for working with PDF files in Python.

# PREREQUISITE: You must install pypdf first.
# Open your terminal or command prompt and run:
# pip install pypdf

from pypdf import PdfReader, PdfWriter
import json

# --- STEP 1: INSPECT THE PDF TO FIND FIELD NAMES ---
# Before you can fill a form, you MUST know the internal names of the fields.
# This function helps you discover those names. You only need to run this once
# for a given PDF template.

def inspect_pdf_form_fields(pdf_path):
    """
    Reads a PDF and prints a dictionary of its fillable form fields.
    This is a crucial first step for mapping your data to the PDF fields.
    """
    print(f"--- Inspecting fields for: {pdf_path} ---")
    try:
        reader = PdfReader(pdf_path)
        fields = reader.get_fields()
        if not fields:
            print("This PDF does not contain any fillable form fields.")
            return
        
        print("Found the following form fields:")
        # Pretty print the dictionary for readability
        import pprint
        pprint.pprint(fields)
        print("--- End of Inspection ---")

    except FileNotFoundError:
        print(f"Error: The file '{pdf_path}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred during inspection: {e}")

# --- STEP 2: PRE-POPULATE THE FORM ---
# This function takes the data and fills out the PDF.

def populate_cm010(input_pdf_path, output_pdf_path, data_to_fill):
    """
    Fills the CM-010 PDF form with the provided data and saves it to a new file.
    
    Args:
        input_pdf_path (str): The file path for the blank cm010.pdf template.
        output_pdf_path (str): The file path where the populated PDF will be saved.
        data_to_fill (dict): A dictionary containing the data to populate the form.
    """
    print(f"\n--- Starting to populate {input_pdf_path} ---")
    try:
        reader = PdfReader(input_pdf_path)
        writer = PdfWriter()

        # Copy all pages from the original PDF to the writer object
        for page in reader.pages:
            writer.add_page(page)

        # This mapping connects your human-readable data keys to the actual,
        # often complex, field names discovered in Step 1.
        # NOTE: These keys are derived from inspecting a standard CM-010 form
        # and may need to be adjusted if the form version changes.
        field_mapping = {
            # Header Information
            "attorney_name_address": "topmostSubform[0].Page1[0].f1_01[0]",
            "attorney_for": "topmostSubform[0].Page1[0].f1_03[0]",
            # Court Information
            "county": "topmostSubform[0].Page1[0].f1_02[0]",
            "court_street_address": "topmostSubform[0].Page1[0].f1_04[0]",
            "court_city_zip": "topmostSubform[0].Page1[0].f1_06[0]",
            "court_branch_name": "topmostSubform[0].Page1[0].f1_07[0]",
            # Case Information
            "case_name": "topmostSubform[0].Page1[0].f1_08[0]",
            "judge_name": "topmostSubform[0].Page1[0].f1_10[0]",
            "dept_number": "topmostSubform[0].Page1[0].f1_11[0]",
            # Checkboxes (these require a special value: '/Yes' to check)
            "is_complex_checkbox": "topmostSubform[0].Page1[0].c1_01[1]",
            "remedy_monetary_checkbox": "topmostSubform[0].Page1[0].c1_02[0]",
            "remedy_nonmonetary_checkbox": "topmostSubform[0].Page1[0].c1_03[0]"
        }

        # Prepare the final dictionary for the PDF writer
        pdf_field_data = {
            field_mapping["attorney_name_address"]: data_to_fill.get("attorney_details", ""),
            field_mapping["attorney_for"]: data_to_fill.get("attorney_representing", ""),
            field_mapping["county"]: data_to_fill.get("county", ""),
            field_mapping["court_street_address"]: data_to_fill.get("court_street", ""),
            field_mapping["court_city_zip"]: data_to_fill.get("court_city_zip", ""),
            field_mapping["court_branch_name"]: data_to_fill.get("court_branch", ""),
            field_mapping["case_name"]: data_to_fill.get("case_name", ""),
            field_mapping["judge_name"]: data_to_fill.get("judge", ""),
            field_mapping["dept_number"]: data_to_fill.get("department", ""),
            # Set checkbox values. If the key exists and is True, set to '/Yes'.
            field_mapping["is_complex_checkbox"]: '/Yes' if data_to_fill.get("is_complex") else '/Off',
            field_mapping["remedy_monetary_checkbox"]: '/Yes' if data_to_fill.get("wants_monetary") else '/Off',
            field_mapping["remedy_nonmonetary_checkbox"]: '/Yes' if data_to_fill.get("wants_nonmonetary") else '/Off',
        }

        # Update the form fields on the first page of the PDF
        writer.update_page_form_field_values(
            writer.pages[0], pdf_field_data
        )

        # Write the updated content to a new, populated PDF file
        with open(output_pdf_path, "wb") as output_stream:
            writer.write(output_stream)
        
        print(f"Successfully pre-populated form and saved to '{output_pdf_path}'")

    except FileNotFoundError:
        print(f"Error: The input file '{input_pdf_path}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred during population: {e}")

# --- SCRIPT EXECUTION ---
if __name__ == "__main__":
    
    # Define the path to your blank PDF template
    blank_pdf_template = 'cm010.pdf'
    
    # Run the inspection function first to see all available field names
    inspect_pdf_form_fields(blank_pdf_template)
    
    # --- This simulates the data Ingrid would have in its database ---
    # This data would be pulled based on the user's selections (County, Judge, etc.)
    ingrid_court_database = {
        "county": "Santa Clara",
        "court_street": "191 North First Street",
        "court_city_zip": "San Jose, CA 95113",
        "court_branch": "Downtown Superior Court",
        "judge": "Hon. Charles F. Adams",
        "department": "7"
    }
    
    # This data would come from the user's profile or direct input
    user_case_data = {
        "attorney_details": "Jane Doe (SBN 123456)\n123 Main Street\nAnytown, CA 90210\nTel: (555) 123-4567\nEmail: jane.doe@lawfirm.com",
        "attorney_representing": "Plaintiff JOHN SMITH",
        "case_name": "JOHN SMITH vs. MEGA CORP., et al.",
        "is_complex": True,
        "wants_monetary": True,
        "wants_nonmonetary": True
    }
    
    # Combine the data sources into one dictionary
    final_data_to_populate = {**ingrid_court_database, **user_case_data}
    
    # Define the name for the newly created, populated PDF
    populated_pdf_output = 'cm010_INGRID_POPULATED.pdf'
    
    # Run the population function
    populate_cm010(blank_pdf_template, populated_pdf_output, final_data_to_populate)
