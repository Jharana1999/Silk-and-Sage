import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.api import api_router


def seed_admin():
    from app.models.user import User, UserRole
    from app.core.security import hash_password
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == settings.ADMIN_EMAIL).first():
            db.add(User(
                email=settings.ADMIN_EMAIL,
                full_name="Silk and Sage Admin",
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True,
            ))
            db.commit()
            print(f"Admin created: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


def seed_sample_data():
    from app.models.category import Category
    from app.models.product import Product, ProductImage
    db = SessionLocal()
    try:
        if db.query(Category).count() > 0:
            return

        categories = [
            Category(name="Serums", slug="serums", description="Targeted treatments for brightening, hydration, and anti-aging", sort_order=1),
            Category(name="Moisturizers", slug="moisturizers", description="Hydrating creams and lotions for all skin types", sort_order=2),
            Category(name="Cleansers", slug="cleansers", description="Gentle cleansers that respect your skin barrier", sort_order=3),
            Category(name="Eye Care", slug="eye-care", description="Specialized care for the delicate eye area", sort_order=4),
            Category(name="Masks", slug="masks", description="Weekly treatments for deep cleansing and renewal", sort_order=5),
            Category(name="Toners", slug="toners", description="Balancing and prepping essentials for your routine", sort_order=6),
        ]
        db.add_all(categories)
        db.flush()

        # All prices in NPR (Nepalese Rupees)
        products_data = [
            {
                "name": "The Ordinary Niacinamide 10% + Zinc 1%",
                "slug": "the-ordinary-niacinamide-10-zinc-1",
                "short_description": "High-strength vitamin and mineral blemish formula for oily and acne-prone skin.",
                "description": "A high-strength 10% niacinamide serum with 1% zinc that reduces the appearance of blemishes and pores, balances sebum production, and evens skin tone. The Ordinary's bestseller — lightweight, fast-absorbing, and effective from day one.",
                "price": 1450.00,
                "compare_at_price": 1800.00,
                "category_id": categories[0].id,
                "is_featured": True,
                "is_bestseller": True,
                "skin_type": ["oily", "combination", "acne-prone"],
                "tags": ["niacinamide", "brightening", "pore-minimizing", "the-ordinary"],
                "stock_quantity": 80,
            },
            {
                "name": "CeraVe Moisturizing Cream",
                "slug": "cerave-moisturizing-cream",
                "short_description": "24-hour hydrating moisturizer with ceramides and hyaluronic acid. Fragrance-free.",
                "description": "Developed with dermatologists, CeraVe Moisturizing Cream provides 24-hour hydration for dry to very dry skin. Contains three essential ceramides (1, 3, 6-II) to restore the skin barrier, plus hyaluronic acid to retain moisture. Non-comedogenic and fragrance-free — suitable for the whole family including sensitive skin.",
                "price": 2200.00,
                "category_id": categories[1].id,
                "is_featured": True,
                "is_bestseller": True,
                "skin_type": ["dry", "very-dry", "sensitive", "all"],
                "tags": ["ceramides", "moisturizer", "fragrance-free", "cerave"],
                "stock_quantity": 60,
            },
            {
                "name": "Cetaphil Gentle Skin Cleanser",
                "slug": "cetaphil-gentle-skin-cleanser",
                "short_description": "Mild, non-irritating cleanser for sensitive, dry, or normal skin.",
                "description": "Cetaphil Gentle Skin Cleanser is a soap-free, fragrance-free formula that cleanses without stripping natural oils or disrupting the skin's pH balance. Recommended by dermatologists worldwide for over 70 years. Works on face and body, rinses clean without leaving residue.",
                "price": 950.00,
                "compare_at_price": 1200.00,
                "category_id": categories[2].id,
                "is_featured": True,
                "skin_type": ["sensitive", "dry", "normal", "all"],
                "tags": ["cleanser", "gentle", "fragrance-free", "cetaphil"],
                "stock_quantity": 100,
            },
            {
                "name": "Klairs Freshly Juiced Vitamin Drop",
                "slug": "klairs-freshly-juiced-vitamin-drop",
                "short_description": "5% pure vitamin C serum for brightening, anti-aging, and antioxidant protection.",
                "description": "Klairs Freshly Juiced Vitamin Drop uses 5% ascorbic acid in a stable, low-irritation formula ideal for beginners and sensitive skin. It visibly brightens dull skin, reduces dark spots and hyperpigmentation, and fights free radical damage. Lightweight serum texture absorbs quickly without residue.",
                "price": 2800.00,
                "compare_at_price": 3500.00,
                "category_id": categories[0].id,
                "is_new_arrival": True,
                "is_featured": True,
                "skin_type": ["all", "sensitive", "dull"],
                "tags": ["vitamin-c", "brightening", "antioxidant", "klairs"],
                "stock_quantity": 45,
            },
            {
                "name": "The INKEY List Salicylic Acid Cleanser",
                "slug": "inkey-list-salicylic-acid-cleanser",
                "short_description": "2% salicylic acid face wash that unclogs pores and controls excess oil.",
                "description": "This targeted cleanser from The INKEY List uses 2% salicylic acid to exfoliate inside pores, remove dead skin cells, and reduce blackheads. Ideal for oily and acne-prone skin. Gentle enough for daily use while effectively managing breakouts and shine.",
                "price": 1650.00,
                "category_id": categories[2].id,
                "is_bestseller": True,
                "skin_type": ["oily", "combination", "acne-prone"],
                "tags": ["salicylic-acid", "acne", "pore-cleansing", "inkey-list"],
                "stock_quantity": 70,
            },
            {
                "name": "Laneige Lip Sleeping Mask",
                "slug": "laneige-lip-sleeping-mask",
                "short_description": "Overnight lip treatment with Berry Mix Complex for soft, hydrated lips.",
                "description": "The iconic Laneige Lip Sleeping Mask works overnight to repair dry, chapped lips with its Berry Mix Complex — a blend of strawberry, raspberry, blueberry, and cranberry extracts rich in antioxidants and vitamins. Wake up to visibly softer, plumper lips. Available in Berry, Vanilla, and Apple Lime.",
                "price": 1900.00,
                "compare_at_price": 2400.00,
                "category_id": categories[4].id,
                "is_new_arrival": True,
                "is_bestseller": True,
                "skin_type": ["all"],
                "tags": ["lip-mask", "overnight", "hydrating", "laneige"],
                "stock_quantity": 55,
            },
        ]

        for p_data in products_data:
            product = Product(**p_data)
            db.add(product)
            db.flush()
            db.add(ProductImage(
                product_id=product.id,
                url="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
                is_primary=True,
                sort_order=0,
            ))

        db.commit()
        print("Sample data seeded successfully")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_admin()
    seed_sample_data()
    yield


app = FastAPI(
    title="Silk and Sage API",
    description="Nepal's Favourite Skincare Store — Multi-Brand E-Commerce API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = os.path.join(settings.UPLOAD_DIR, "products")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Silk and Sage API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
