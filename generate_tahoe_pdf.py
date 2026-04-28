from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register DejaVu fonts (support Cyrillic)
pdfmetrics.registerFont(TTFont('DejaVu', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))

W, H = A4  # 595 x 842

# Color palette — Lake Tahoe inspired
DEEP_BLUE    = colors.HexColor('#1A3A5C')
TEAL         = colors.HexColor('#0D7377')
SKY_BLUE     = colors.HexColor('#A8D8EA')
LIGHT_BG     = colors.HexColor('#F0F7FF')
ACCENT       = colors.HexColor('#F4845F')
SAND         = colors.HexColor('#FFF8F0')
WHITE        = colors.white
DARK         = colors.HexColor('#2C3E50')
MUTED        = colors.HexColor('#7F8C8D')

def draw_rounded_rect(c, x, y, w, h, r, fill_color, stroke_color=None):
    c.setFillColor(fill_color)
    if stroke_color:
        c.setStrokeColor(stroke_color)
        c.setLineWidth(1)
    else:
        c.setStrokeColor(fill_color)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1 if stroke_color else 0)

def draw_cover(c):
    # Background gradient-like with two rectangles
    c.setFillColor(DEEP_BLUE)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Wave decoration top
    c.setFillColor(TEAL)
    p = c.beginPath()
    p.moveTo(0, H)
    p.lineTo(W, H)
    p.lineTo(W, H - 120)
    p.curveTo(W * 0.75, H - 80, W * 0.25, H - 160, 0, H - 120)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

    # Wave decoration bottom
    c.setFillColor(TEAL)
    p = c.beginPath()
    p.moveTo(0, 0)
    p.lineTo(W, 0)
    p.lineTo(W, 110)
    p.curveTo(W * 0.75, 150, W * 0.25, 70, 0, 110)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

    # Circle decorations
    c.setFillColor(colors.HexColor('#0D7377'))
    c.setStrokeColor(colors.HexColor('#14A0A5'))
    c.setLineWidth(2)
    c.circle(W - 60, H - 60, 80, fill=0, stroke=1)
    c.circle(W - 60, H - 60, 55, fill=0, stroke=1)
    c.circle(60, 60, 60, fill=0, stroke=1)
    c.circle(60, 60, 40, fill=0, stroke=1)

    # Accent line
    c.setStrokeColor(ACCENT)
    c.setLineWidth(4)
    c.line(W * 0.2, H * 0.52, W * 0.8, H * 0.52)

    # Main title
    c.setFillColor(WHITE)
    c.setFont('DejaVuBold', 42)
    c.drawCentredString(W / 2, H * 0.62, 'LAKE TAHOE')

    c.setFont('DejaVuBold', 28)
    c.setFillColor(SKY_BLUE)
    c.drawCentredString(W / 2, H * 0.55, 'TRIP 2026')

    # Subtitle Russian
    c.setFont('DejaVu', 16)
    c.setFillColor(colors.HexColor('#B0D4E8'))
    c.drawCentredString(W / 2, H * 0.47, 'Маршрут поездки • California')

    # Days summary boxes
    box_w = 110
    box_h = 60
    gap = 20
    total = 3 * box_w + 2 * gap
    start_x = (W - total) / 2
    box_y = H * 0.33

    days = [
        ('ДЕНЬ 1', 'Знакомство'),
        ('ДЕНЬ 2', 'Озеро + Хайкинг'),
        ('ДЕНЬ 3', 'Финал'),
    ]
    for i, (d, sub) in enumerate(days):
        bx = start_x + i * (box_w + gap)
        draw_rounded_rect(c, bx, box_y, box_w, box_h, 8,
                          colors.HexColor('#0D5C8A'), colors.HexColor('#1A90C8'))
        c.setFillColor(SKY_BLUE)
        c.setFont('DejaVuBold', 12)
        c.drawCentredString(bx + box_w / 2, box_y + box_h - 22, d)
        c.setFont('DejaVu', 9)
        c.setFillColor(colors.HexColor('#C5E8F5'))
        c.drawCentredString(bx + box_w / 2, box_y + 12, sub)

    # Bottom tagline
    c.setFont('DejaVu', 12)
    c.setFillColor(colors.HexColor('#90BED4'))
    c.drawCentredString(W / 2, 45, 'Изумрудное озеро • Горные тропы • Незабываемые моменты')


def section_header(c, y, day_num, title, subtitle, color):
    # Full-width colored band
    c.setFillColor(color)
    c.rect(0, y - 10, W, 58, fill=1, stroke=0)

    # Day badge
    draw_rounded_rect(c, 30, y - 4, 70, 44, 6, colors.HexColor('#FFFFFF30'))
    c.setFillColor(WHITE)
    c.setFont('DejaVuBold', 9)
    c.drawCentredString(65, y + 28, 'ДЕНЬ')
    c.setFont('DejaVuBold', 24)
    c.drawCentredString(65, y + 8, str(day_num))

    # Title
    c.setFillColor(WHITE)
    c.setFont('DejaVuBold', 20)
    c.drawString(115, y + 22, title)
    c.setFont('DejaVu', 11)
    c.setFillColor(colors.HexColor('#FFFFFFCC'))
    c.drawString(115, y + 7, subtitle)

    return y - 10 - 58 - 12  # next y


def block_header(c, y, icon, label, color):
    draw_rounded_rect(c, 30, y - 6, W - 60, 28, 5, color)
    c.setFillColor(WHITE)
    c.setFont('DejaVuBold', 12)
    c.drawString(45, y + 6, f'{icon}  {label}')
    return y - 6 - 28 - 8


def bullet_line(c, y, text, indent=50):
    c.setFillColor(ACCENT)
    c.circle(indent - 8, y + 4, 2.5, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont('DejaVu', 11)
    c.drawString(indent, y, text)
    return y - 18


def draw_divider(c, y):
    c.setStrokeColor(colors.HexColor('#D5E8F5'))
    c.setLineWidth(0.8)
    c.line(30, y, W - 30, y)
    return y - 12


def draw_day1(c):
    c.showPage()
    # Light background
    c.setFillColor(LIGHT_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - 30
    y = section_header(c, y, 1, 'ЗНАКОМСТВО', 'Заезд • Вечеринка • Ночной вайб', DEEP_BLUE)

    # Block 1 — Заезд
    y = block_header(c, y, '☀', 'Заезд + Чилл', TEAL)
    y = bullet_line(c, y, 'Заселение в 16:00')
    y = bullet_line(c, y, 'Лёгкий отдых, знакомство, вайб')
    y -= 6
    y = draw_divider(c, y)

    # Block 2 — BBQ
    y = block_header(c, y, '♨', 'BBQ Party  —  Главный ивент дня', ACCENT)
    y = bullet_line(c, y, 'Шашлык, музыка')
    y = bullet_line(c, y, 'Роли:  Grill Master  /  Bartender  /  DJ')
    y = bullet_line(c, y, 'Игры:  Beer Pong,  Flip Cup')
    y -= 6
    y = draw_divider(c, y)

    # Block 3 — Ночь
    y = block_header(c, y, '★', 'Ночной Вайб', colors.HexColor('#2E4057'))
    y = bullet_line(c, y, 'Костёр или джакузи')
    y = bullet_line(c, y, 'Deep talk')
    y = bullet_line(c, y, 'Песни под гитару (если есть герой!)')

    # Decorative wave bottom
    c.setFillColor(colors.HexColor('#D5EAF7'))
    p = c.beginPath()
    p.moveTo(0, 0)
    p.lineTo(W, 0)
    p.lineTo(W, 50)
    p.curveTo(W * 0.6, 80, W * 0.4, 20, 0, 50)
    p.close()
    c.drawPath(p, fill=1, stroke=0)


def draw_day2(c):
    c.showPage()
    c.setFillColor(LIGHT_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - 30
    y = section_header(c, y, 2, 'ОЗЕРО + ХАЙКИНГ', 'Природа • Маршруты • Закатный вайб', TEAL)

    # Утро
    y = block_header(c, y, '◈', 'Утро  —  Мягкий старт', colors.HexColor('#2196A0'))
    y = bullet_line(c, y, 'Завтрак')
    y = bullet_line(c, y, 'Лёгкая йога / stretch  (20–30 мин)')
    y = bullet_line(c, y, 'Дыхание + разминка')
    y -= 6
    y = draw_divider(c, y)

    # Прогулка
    y = block_header(c, y, '~', 'Прогулка по Lake Tahoe', colors.HexColor('#0D6E75'))
    y = bullet_line(c, y, 'Лёгкий walking вдоль берега')
    y = bullet_line(c, y, 'Фото / видео / чилл у воды')
    y -= 6
    y = draw_divider(c, y)

    # Хайкинг
    y = block_header(c, y, '▲', 'Хайкинг  —  Eagle Falls Trail', colors.HexColor('#1A5276'))
    y = bullet_line(c, y, 'Небольшой маршрут с набором высоты')
    y = bullet_line(c, y, 'Очень красивые виды на водопад и озеро')
    y -= 6
    y = draw_divider(c, y)

    # Обед
    y = block_header(c, y, '♨', 'Возвращение в дом', colors.HexColor('#7D6608'))
    y = bullet_line(c, y, 'Готовим уху')
    y = bullet_line(c, y, 'Обедаем, отдых, общение, сближение')
    y -= 6
    y = draw_divider(c, y)

    # Вечер
    y = block_header(c, y, '♦', 'Вечер  —  Ресторан или Казино', ACCENT)
    y = bullet_line(c, y, 'Ресторан с атмосферой')
    y = bullet_line(c, y, 'или  Казино  (игры + ночной вайб)')

    # Bottom deco
    c.setFillColor(colors.HexColor('#D5EAF7'))
    p = c.beginPath()
    p.moveTo(0, 0)
    p.lineTo(W, 0)
    p.lineTo(W, 50)
    p.curveTo(W * 0.6, 80, W * 0.4, 20, 0, 50)
    p.close()
    c.drawPath(p, fill=1, stroke=0)


def draw_day3(c):
    c.showPage()
    c.setFillColor(LIGHT_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - 30
    y = section_header(c, y, 3, 'ФИНАЛ', 'Последние впечатления • Закрытие поездки', ACCENT)

    # Выселение
    y = block_header(c, y, '◎', 'Выселение', colors.HexColor('#884EA0'))
    y = bullet_line(c, y, 'Сбор вещей, чек-аут из дома')
    y -= 6
    y = draw_divider(c, y)

    # Emerald Bay
    draw_rounded_rect(c, 30, y - 95, W - 60, 100, 10,
                      colors.HexColor('#E8F8F0'), colors.HexColor('#27AE60'))
    c.setFillColor(colors.HexColor('#1E8449'))
    c.setFont('DejaVuBold', 13)
    c.drawString(48, y - 18, '  Остановка 1  —  Emerald Bay State Park')
    c.setFillColor(DARK)
    c.setFont('DejaVu', 11)
    lines1 = [
        'Самая iconic точка Тахо',
        'Вид на изумрудную бухту',
        'Идеально для: общего фото, видео-рекапа, последнего "вау" момента',
    ]
    ly = y - 38
    for l in lines1:
        c.setFillColor(ACCENT)
        c.circle(55, ly + 4, 2.5, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.drawString(62, ly, l)
        ly -= 18
    y -= 95 + 16

    y = draw_divider(c, y)

    # Heavenly Gondola
    draw_rounded_rect(c, 30, y - 85, W - 60, 90, 10,
                      colors.HexColor('#EBF5FB'), colors.HexColor('#2E86C1'))
    c.setFillColor(colors.HexColor('#1A5276'))
    c.setFont('DejaVuBold', 13)
    c.drawString(48, y - 18, '  Остановка 2  —  Heavenly Gondola')
    c.setFillColor(DARK)
    c.setFont('DejaVu', 11)
    lines2 = [
        'Подъём на гондоле с панорамным видом',
        'Спокойный, красивый финал поездки',
    ]
    ly = y - 38
    for l in lines2:
        c.setFillColor(ACCENT)
        c.circle(55, ly + 4, 2.5, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.drawString(62, ly, l)
        ly -= 18
    y -= 85 + 16

    y = draw_divider(c, y)

    # Закрытие
    draw_rounded_rect(c, 30, y - 90, W - 60, 94, 10,
                      colors.HexColor('#FEF9E7'), colors.HexColor('#F39C12'))
    c.setFillColor(colors.HexColor('#B7770D'))
    c.setFont('DejaVuBold', 14)
    c.drawCentredString(W / 2, y - 16, '  Закрытие поездки')
    c.setFont('DejaVu', 11)
    c.setFillColor(DARK)
    closing = ['Кофе / лёгкий перекус', 'Делимся эмоциями', 'Финальное видео / фото']
    ly = y - 36
    for l in closing:
        c.setFillColor(ACCENT)
        c.circle(55, ly + 4, 2.5, fill=1, stroke=0)
        c.setFillColor(DARK)
        c.drawString(62, ly, l)
        ly -= 18

    # Big heart / footer
    c.setFillColor(DEEP_BLUE)
    c.rect(0, 0, W, 70, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont('DejaVuBold', 14)
    c.drawCentredString(W / 2, 38, 'Lake Tahoe  •  California  •  2026')
    c.setFont('DejaVu', 10)
    c.setFillColor(SKY_BLUE)
    c.drawCentredString(W / 2, 20, 'Путешествие, которое останется в сердце навсегда')


def main():
    output = '/home/user/Claude/tahoe_trip.pdf'
    c = canvas.Canvas(output, pagesize=A4)
    c.setTitle('Lake Tahoe Trip 2026')
    c.setAuthor('Trip Planner')

    draw_cover(c)
    draw_day1(c)
    draw_day2(c)
    draw_day3(c)

    c.save()
    print(f'PDF saved: {output}')


if __name__ == '__main__':
    main()
