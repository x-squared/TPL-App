import Std

namespace X2lib

universe u

structure AddSig (α : Type u) where
  add : α → α → α

structure AddMonoidLaws (α : Type u) (A : AddSig α) where
  zero : α
  add_assoc : ∀ a b c : α, A.add (A.add a b) c = A.add a (A.add b c)
  zero_add : ∀ a : α, A.add zero a = a
  add_zero : ∀ a : α, A.add a zero = a

section SingleAddition

variable {α : Type u}
variable (A : AddSig α)

local infixl:65 " +ₐ " => A.add

theorem add_assoc_with_symbol (L : AddMonoidLaws α A) (a b c : α) :
    (a +ₐ b) +ₐ c = a +ₐ (b +ₐ c) := by
  exact AddMonoidLaws.add_assoc L a b c

theorem zero_left_with_symbol (L : AddMonoidLaws α A) (a : α) : A.add L.zero a = a := by
  exact AddMonoidLaws.zero_add L a

theorem zero_right_with_symbol (L : AddMonoidLaws α A) (a : α) : A.add a L.zero = a := by
  exact AddMonoidLaws.add_zero L a

end SingleAddition

structure BiAddSig (α : Type u) where
  add₁ : α → α → α
  add₂ : α → α → α

structure BiAddMonoidLaws (α : Type u) (S : BiAddSig α) where
  zero₁ : α
  zero₂ : α
  assoc₁ : ∀ a b c : α, S.add₁ (S.add₁ a b) c = S.add₁ a (S.add₁ b c)
  assoc₂ : ∀ a b c : α, S.add₂ (S.add₂ a b) c = S.add₂ a (S.add₂ b c)
  zero_add₁ : ∀ a : α, S.add₁ zero₁ a = a
  add_zero₁ : ∀ a : α, S.add₁ a zero₁ = a
  zero_add₂ : ∀ a : α, S.add₂ zero₂ a = a
  add_zero₂ : ∀ a : α, S.add₂ a zero₂ = a
  add_ops_distinct : S.add₁ ≠ S.add₂

section TwoAdditions

variable {α : Type u}
variable (S : BiAddSig α)

local infixl:65 " +₁ " => S.add₁
local infixl:65 " +₂ " => S.add₂

theorem assoc_first_add (L : BiAddMonoidLaws α S) (a b c : α) : (a +₁ b) +₁ c = a +₁ (b +₁ c) := by
  exact BiAddMonoidLaws.assoc₁ L a b c

theorem assoc_second_add (L : BiAddMonoidLaws α S) (a b c : α) : (a +₂ b) +₂ c = a +₂ (b +₂ c) := by
  exact BiAddMonoidLaws.assoc₂ L a b c

theorem add_operations_are_distinct (L : BiAddMonoidLaws α S) : S.add₁ ≠ S.add₂ := by
  exact BiAddMonoidLaws.add_ops_distinct L

end TwoAdditions

end X2lib