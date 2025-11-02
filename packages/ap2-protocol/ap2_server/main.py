import uuid
from fastapi import FastAPI
from ap2.types.payment_request import (
    PaymentRequest,
    PaymentDetailsInit,
    PaymentItem,
    PaymentCurrencyAmount,
    PaymentMethodData,
)

app = FastAPI()

@app.get("/health")
def read_root():
    return {"status": "ok"}

@app.post("/create_payment", response_model=PaymentRequest)
def create_payment(payment_details: PaymentCurrencyAmount):
    payment_item = PaymentItem(
        label="Total",
        amount=payment_details,
    )

    payment_request = PaymentRequest(
        method_data=[
            PaymentMethodData(
                supported_methods="basic-card",
                data={"supportedNetworks": ["visa", "mastercard"]},
            )
        ],
        details=PaymentDetailsInit(
            id=str(uuid.uuid4()),
            display_items=[payment_item],
            total=payment_item,
        ),
    )

    print(f"Creating payment request: {payment_request.json(indent=2)}")
    return payment_request
