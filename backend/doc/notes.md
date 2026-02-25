**Start server**

cd backend
lsof -ti tcp:8000 | xargs kill -9
python -m uvicorn app.main:app --reload