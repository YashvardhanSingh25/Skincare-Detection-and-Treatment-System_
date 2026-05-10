class SkincareRecommender:
    """
    Recommendation Engine for Skincare Routine
    Based on AI extraction features (skin type, visible issues like acne, pigmentation)
    """
    
    def __init__(self):
        # Dermatology-inspired generic rules mapped by Skin Type
        self.products = {
            "cleanser": {
                "Oily": "Salicylic Acid Cleanser (BHA)",
                "Dry": "Hydrating Milk or Cream Cleanser",
                "Combination": "Gentle Foaming Cleanser",
                "Normal": "Balanced pH Cleanser"
            },
            "toner": {
                "Oily": "Witch Hazel or Niacinamide Toner",
                "Dry": "Hyaluronic Acid Hydrating Toner",
                "Combination": "PHA-based Mild Toner",
                "Normal": "Rose Water or Green Tea Toner"
            },
            "moisturizer": {
                "Oily": "Lightweight Oil-Free Gel Moisturizer",
                "Dry": "Rich Ceramide-based Cream",
                "Combination": "Water-based Lightweight Lotion",
                "Normal": "Standard Hydrating Lotion"
            },
            "sunscreen": {
                "Oily": "Matte Finish Sunscreen SPF 50",
                "Dry": "Hydrating Sunscreen SPF 50",
                "Combination": "Gel-based Sunscreen SPF 50",
                "Normal": "Broad Spectrum Sunscreen SPF 50"
            }
        }
        
        # Specific active treatments based on AI-detected skin issues
        self.treatments = {
            "acne": "Benzoyl Peroxide 2.5% Spot Treatment or Adapalene Gel",
            # "blackheads": "Vitamin C Serum (AM) / Alpha Arbutin (PM)", 
            "dark spots": "Vitamin C Serum (AM) / Alpha Arbutin (PM)",
            "wrinkles": "Retinol 0.2% Serum (PM only)",
            # "redness": "Centella Asiatica / Niacinamide Serum",
            # "texture": "AHA Exfoliant (Glycolic/Lactic Acid) - 2x/week",
            "blackheades": "BHA Liquid Exfoliant (Salicylic Acid)",
            "pores": "Niacinamide 10% Serum"
        }
# CATEGORIES = ['acne', 'blackheades', 'dark spots', 'pores', 'wrinkles']

    def generate_routine(self, skin_type, detected_issues=None):
        """
        Generates a personalized skincare routine based on skin type and AI-detected issues.
        """
        if not detected_issues:
            detected_issues = []
            
        # Normalize input
        skin_type = str(skin_type).strip().capitalize()
        if skin_type not in self.products["cleanser"]:
            skin_type = "Normal" # Default fallback
            
        is_healthy = False
        # If "normal" is the result, or no issues were passed
        if not detected_issues or (len(detected_issues) == 1 and detected_issues[0].lower() == "normal"):
            is_healthy = True

        is_completely_normal = (is_healthy and skin_type == "Normal")

        routine = {
            "is_healthy": is_healthy,
            "is_completely_normal": is_completely_normal,
            "message": "You don't have any skin disease. You are completely healthy!" if is_healthy else "",
            "cured_message": "You are cured and no need medical care." if is_completely_normal else "",
            "Morning": [
                f"1. Cleanser: {self.products['cleanser'][skin_type]}",
                f"2. Toner: {self.products['toner'][skin_type]}",
            ],
            "Night": [
                "1. Double Cleanse: Cleansing Balm or Micellar Water",
                f"2. Cleanser: {self.products['cleanser'][skin_type]}",
                f"3. Toner: {self.products['toner'][skin_type]}",
            ]
        }
        
        # Determine AM and PM treatments
        am_treatments = []
        pm_treatments = []
        
        if not is_healthy:
            for issue in detected_issues:
                issue = issue.lower()
                if issue in self.treatments:
                    if issue in ['dark spots', 'pores', 'blackheades','normal','acne',]:
                        am_treatments.append(self.treatments[issue])
                    elif issue in ['wrinkles', 'acne']:
                        pm_treatments.append(self.treatments[issue])
                    else: 
                        am_treatments.append(self.treatments[issue])
                         
        if am_treatments:
             routine["Morning"].append(f"3. Treatments: {', '.join(set(am_treatments))}")
        if pm_treatments:
             routine["Night"].append(f"4. Treatments: {', '.join(set(pm_treatments))}")
             
        # Add moisturizers and sunscreens
        routine["Morning"].extend([
            f"{len(routine['Morning'])+1}. Moisturizer: {self.products['moisturizer'][skin_type]}",
            f"{len(routine['Morning'])+2}. Sunscreen: {self.products['sunscreen'][skin_type]} (Reapply every 2 hours)"
        ])
        
        routine["Night"].append(
            f"{len(routine['Night'])+1}. Moisturizer: {self.products['moisturizer'][skin_type]}"
        )
        
        return routine
