# LIDC-IDRI Dataset Guide

> **Atomorphic Mini Hackathon - Pre-Hackathon Reading**  
> Estimated reading time: ~10 minutes

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

> Verified against the sample XML in `simple-viewer/public/data/sample_annotations/069.xml`.

The LIDC XML uses a default namespace (`xmlns="http://www.nih.gov"`), so you must include it in all tag searches:

```python
import xml.etree.ElementTree as ET

NS = 'http://www.nih.gov'

def tag(name):
    return f'{{{NS}}}{name}'

def parse_lidc_xml(xml_path):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    nodules = []

    for session in root.findall(f'.//{tag("readingSession")}'):
        for nodule in session.findall(tag('unblindedReadNodule')):
            nodule_id = nodule.find(tag('noduleID')).text

            chars = nodule.find(tag('characteristics'))
            m_el = chars.find(tag('malignancy')) if chars is not None else None
            malignancy = int(m_el.text) if m_el is not None else None

            contours = []
            for roi in nodule.findall(tag('roi')):
                z_pos = float(roi.find(tag('imageZposition')).text)
                points = [
                    (int(e.find(tag('xCoord')).text), int(e.find(tag('yCoord')).text))
                    for e in roi.findall(tag('edgeMap'))
                ]
                contours.append({'z': z_pos, 'points': points})

            nodules.append({'id': nodule_id, 'malignancy': malignancy, 'contours': contours})

    return nodules
```

---

## Important: Coordinate Conversion

XML contains **pixel coordinates** (x, y) and **Z position in mm**.

To display in Cornerstone3D, you need **world coordinates** (all in mm).

```
XML pixel (x, y) + Z position → World (x, y, z) mm
```

Steps:
1. Find the DICOM imageId whose slice Z position matches `imageZposition`
2. Convert pixel → world using `utilities.imageToWorldCoords(imageId, [xCoord, yCoord])` from `@cornerstonejs/core`
3. Create the annotation with those world coordinates

> **Note:** Do NOT use `viewport.canvasToWorld()` here — that converts screen pixel positions, not DICOM image pixel indices. See `CORNERSTONE_GUIDE.md` for a full explanation of the difference.

---

## Dataset Access

- Download: https://www.cancerimagingarchive.net/collection/lidc-idri/
- Python library: `pip install pylidc`

---

## Next Steps

Continue to `MEDICAL_AI_MODEL.md` to learn about AI segmentation tools.
