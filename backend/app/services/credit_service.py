import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from fastapi import HTTPException, status
from app.models.user import User
from app.models.credit_transaction import CreditTransaction, TransactionType


class CreditService:
    async def check_credits(self, user: User, required: int = 1) -> bool:
        return user.credits_remaining >= required

    async def deduct_credits(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        amount: int,
        reference_id: str | None = None,
        description: str = "Generation credit usage",
    ) -> User:
        # Atomik UPDATE: hem kontrol hem düşme tek sorguda — race condition yok
        stmt = (
            update(User)
            .where(User.id == user_id, User.credits_remaining >= amount)
            .values(credits_remaining=User.credits_remaining - amount)
            .returning(User)
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            exists = await db.execute(select(User.id).where(User.id == user_id))
            if not exists.scalar_one_or_none():
                raise HTTPException(status_code=404, detail="User not found")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Insufficient credits",
            )
        transaction = CreditTransaction(
            user_id=user_id,
            amount=-amount,
            type=TransactionType.use,
            reference_id=reference_id,
            description=description,
        )
        db.add(transaction)
        await db.flush()
        return user

    async def add_credits(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        amount: int,
        transaction_type: TransactionType = TransactionType.admin,
        description: str = "Credit addition",
        # legacy compat — ignored
        credit_type: str = "clothing",
    ) -> User:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.credits_remaining += amount
        transaction = CreditTransaction(
            user_id=user_id,
            amount=amount,
            type=transaction_type,
            description=description,
        )
        db.add(transaction)
        await db.flush()
        return user

    async def get_balance(self, db: AsyncSession, user_id: uuid.UUID, credit_type: str = "clothing") -> int:
        result = await db.execute(
            select(User.credits_remaining).where(User.id == user_id)
        )
        return result.scalar_one_or_none() or 0


credit_service = CreditService()
