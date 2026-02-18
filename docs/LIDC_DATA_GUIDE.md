# LIDC-IDRI Dataset Guide

> **Pre-Hackathon Reading Material**  
> Estimated reading time: 20-30 minutes

---

## What is LIDC-IDRI?

**LIDC-IDRI** (Lung Image Database Consortium) is a public dataset of:
- **1018 CT scans** of lungs
- **Annotations from 4 radiologists** per case
- **Nodule characteristics** (malignancy, texture, etc.)
- **XML format** for contour annotations

---

## XML Annotation Structure

```xml
<LidcReadMessage>
  <readingSession>
    <servicingRadiologistID>reader1</servicingRadiologistID>
    
    <!-- Nodules >= 3mm with full details -->
    <unblindedReadNodule>
      <noduleID>Nodule 001</noduleID>
      
      <characteristics>
        <malignancy>3</malignancy>  <!-- 1-5 scale -->
        <texture>5</texture>
        <!-- ... more characteristics -->
      </characteristics>
      
      <!-- Contours per slice -->
      <roi>
        <imageZposition>-122.5</imageZposition>
        <imageSOP_UID>1.3.6.1.4...</imageSOP_UID>
        
        <!-- Contour points (pixel coordinates) -->
        <edgeMap>
          <xCoord>312</xCoord>
          <yCoord>347</yCoord>
        </edgeMap>
        <edgeMap>
          <xCoord>313</xCoord>
          <yCoord>347</yCoord>
        </edgeMap>
        <!-- ... more points -->
      </roi>
    </unblindedReadNodule>
    
  </readingSession>
</LidcReadMessage>
```

---

## Key Elements

| Element | Description |
|---------|-------------|
| `<readingSession>` | One radiologist's annotations |
| `<unblindedReadNodule>` | Nodule >= 3mm |
| `<characteristics>` | Radiologist assessments |
| `<roi>` | Contour on ONE slice |
| `<imageZposition>` | Z coordinate in mm |
| `<edgeMap>` | One point (x, y) in pixels |

---

## Malignancy Rating

| Value | Meaning |
|-------|---------|
| 1 | Highly Unlikely (benign) |
| 2 | Moderately Unlikely |
| 3 | Indeterminate |
| 4 | Moderately Suspicious |
| 5 | Highly Suspicious (malignant) |

---

## Parsing Example (Python)

```python
import xml.etree.ElementTree as ET

def parse_lidc_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    nodules = []
    
    for session in root.findall('.//readingSession'):
        for nodule in session.findall('unblindedReadNodule'):
            nodule_id = nodule.find('noduleID').text
            
            # Get malignancy
            chars = nodule.find('characteristics')
            malignancy = int(chars.find('malignancy').text)
            
            # Get contours
            contours = []
            for roi in nodule.findall('roi'):
                z_pos = float(roi.find('imageZposition').text)
                
                points = []
                for edge in roi.findall('edgeMap'):
                    x = int(edge.find('xCoord').text)
                    y = int(edge.find('yCoord').text)
                    points.append((x, y))
                
                contours.append({
                    'z': z_pos,
                    'points': points
                })
            
            nodules.append({
                'id': nodule_id,
                'malignancy': malignancy,
                'contours': contours
            })
    
    return nodules
```

---

## Important: Coordinate Conversion

XML contains **pixel coordinates** (x, y) and **Z position in mm**.

To display in Cornerstone3D, you need **world coordinates** (all in mm).

```
XML pixel (x, y) + Z position → DICOM affine → World (x, y, z) mm
```

Steps:
1. Find the DICOM slice matching the Z position
2. Use that slice's affine to convert pixel → world
3. Create annotation with world coordinates

---

## Dataset Access

- Download: https://wiki.cancerimagingarchive.net/display/Public/LIDC-IDRI
- Python library: `pip install pylidc`
