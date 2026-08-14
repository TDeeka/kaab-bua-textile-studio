# Kaab Bua Fashion Textile Studio

ใส่โลโก้ ubru-logo.png และ tsri-logo.png ในโฟลเดอร์ assets แล้วเปิด index.html


## Update: Selected Phrase Highlight

หลังจากฟังเพลงจบและระบบวิเคราะห์เสร็จ:
- Waveform จะแสดงพื้นสีชมพูโปร่งในช่วงที่ระบบเลือก
- มีเส้นสีทองกำหนดจุดเริ่มและจุดสิ้นสุด
- Waveform ในช่วงที่เลือกจะเข้มขึ้น
- แสดงเวลาเริ่ม–สิ้นสุดใต้ Waveform
- Playhead สีดำยังเคลื่อนตามเพลงตามปกติ


## New update
- เพิ่ม Beat Markers ใต้ Waveform ภายในช่วง Highlight
- เพิ่ม Motif ใหม่ 3 แบบ: ลายกาบเพรียวสูง, ลายกาบซ้อนชั้น, ลายกาบประดับกลาง


## Update: Beat Numbers + Motif Preview + Gallery

- Beat Marker ทุกจุดในช่วง Highlight มีหมายเลขลำดับ Beat
- เพิ่มภาพ Preview Motif ทั้ง 6 แบบ และคลิกภาพเพื่อเลือกได้
- เพิ่มปุ่ม SAVE TO GALLERY หลังทอผ้าเสร็จ
- Gallery เก็บภาพตัวอย่างลายผ้า ชื่อเพลง Motif ช่วงเพลง BPM/Beat/Note
- Gallery ใช้ localStorage จึงคงอยู่เมื่อเปิดเว็บใหม่บนเบราว์เซอร์เดิม
- เก็บได้สูงสุด 12 ผลงาน และลบ/ดาวน์โหลดแต่ละรายการได้


## Update: Weft Ikat Weaving Guide

- เพิ่มส่วน WEAVING GUIDE
- ใช้มาตรฐาน Prototype 24 × 24
- แปลง Motif ทั้ง 6 แบบเป็น Tie Map อัตโนมัติ
- ■ สีชมพู = จุดมัด / resist
- □ สีขาว = ไม่มัด
- มี Row-by-Row Guide ระบุช่วงตำแหน่งที่ต้องมัด
- ดาวน์โหลด Tie Map เป็น PNG
- ดาวน์โหลดข้อมูลรายแถวเป็น CSV
- รองรับ Print Guide ผ่าน Browser

หมายเหตุ: Tie Map เป็น Research Prototype สำหรับทดลองและสื่อสารแบบลาย
ก่อนผลิตจริงควรตรวจสอบจำนวนเส้น ขนาดหมี่ ระยะมัด การย้อม และการทอร่วมกับช่างทอ
