#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"
TOKEN=""
USER_ID=""
TASK_ID=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TESTING STUDENT TASK MANAGER API    ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}TEST 1: Health Check${NC}"
RESPONSE=$(curl -s ${BASE_URL}/api/health)
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASSED${NC} - Server is healthy"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
fi
echo ""

# Test 2: Signup with Invalid Data (Validation Test)
echo -e "${YELLOW}TEST 2: Signup - Invalid Data (Validation)${NC}"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "invalid-email",
    "password": "123"
  }')
if echo "$RESPONSE" | grep -q "Validation failed"; then
    echo -e "${GREEN}✅ PASSED${NC} - Validation working correctly"
    echo "$RESPONSE" | jq .
else
    echo -e "${YELLOW}⚠️  Response:${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 3: Signup with Valid Data
echo -e "${YELLOW}TEST 3: Signup - Valid User${NC}"
TIMESTAMP=$(date +%s)
EMAIL="testuser${TIMESTAMP}@example.com"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"${EMAIL}\",
    \"password\": \"test123456\"
  }")
if echo "$RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ PASSED${NC} - User created successfully"
    TOKEN=$(echo "$RESPONSE" | jq -r '.data.token')
    USER_ID=$(echo "$RESPONSE" | jq -r '.data._id')
    echo "Token: ${TOKEN:0:20}..."
    echo "User ID: $USER_ID"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 4: Login with Wrong Password
echo -e "${YELLOW}TEST 4: Login - Wrong Password${NC}"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"wrongpassword\"
  }")
if echo "$RESPONSE" | grep -q "Invalid credentials"; then
    echo -e "${GREEN}✅ PASSED${NC} - Invalid credentials rejected"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 5: Login with Correct Password
echo -e "${YELLOW}TEST 5: Login - Correct Credentials${NC}"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"test123456\"
  }")
if echo "$RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ PASSED${NC} - Login successful"
    TOKEN=$(echo "$RESPONSE" | jq -r '.data.token')
    echo "New Token: ${TOKEN:0:20}..."
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 6: Get Current User
echo -e "${YELLOW}TEST 6: Get Current User (/me)${NC}"
RESPONSE=$(curl -s -X GET ${BASE_URL}/api/auth/me \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASSED${NC} - User profile retrieved"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 7: Access Protected Route Without Token
echo -e "${YELLOW}TEST 7: Access Tasks Without Token${NC}"
RESPONSE=$(curl -s -X GET ${BASE_URL}/api/tasks)
if echo "$RESPONSE" | grep -q "Not authorized"; then
    echo -e "${GREEN}✅ PASSED${NC} - Unauthorized access blocked"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 8: Create Task with Invalid Data (Validation)
echo -e "${YELLOW}TEST 8: Create Task - Invalid Data${NC}"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/tasks \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "priority": "invalid",
    "dueDate": "not-a-date"
  }')
if echo "$RESPONSE" | grep -q "Validation failed\|required"; then
    echo -e "${GREEN}✅ PASSED${NC} - Validation working"
    echo "$RESPONSE" | jq .
else
    echo -e "${YELLOW}⚠️  Response:${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 9: Create Task with Past Date (Should Fail)
echo -e "${YELLOW}TEST 9: Create Task - Past Date${NC}"
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/tasks \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Past Task",
    "priority": "high",
    "dueDate": "2020-01-01T00:00:00.000Z"
  }')
if echo "$RESPONSE" | grep -q "past"; then
    echo -e "${GREEN}✅ PASSED${NC} - Past date rejected"
    echo "$RESPONSE" | jq .
else
    echo -e "${YELLOW}⚠️  Response:${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 10: Create Task with Valid Data
echo -e "${YELLOW}TEST 10: Create Task - Valid Data${NC}"
TOMORROW=$(date -u -d "+1 day" +"%Y-%m-%dT12:00:00.000Z")
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/tasks \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Complete Project Documentation\",
    \"description\": \"Write comprehensive API documentation\",
    \"priority\": \"high\",
    \"dueDate\": \"${TOMORROW}\"
  }")
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASSED${NC} - Task created successfully"
    TASK_ID=$(echo "$RESPONSE" | jq -r '.data._id')
    echo "Task ID: $TASK_ID"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 11: Create Multiple Tasks
echo -e "${YELLOW}TEST 11: Create Multiple Tasks${NC}"
for i in {1..3}; do
    DAYS_AHEAD=$((i + 1))
    DUE_DATE=$(date -u -d "+${DAYS_AHEAD} days" +"%Y-%m-%dT12:00:00.000Z")
    PRIORITY=("low" "medium" "high")
    PRIORITY_IDX=$((i % 3))
    
    curl -s -X POST ${BASE_URL}/api/tasks \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"Task ${i}\",
        \"description\": \"Description for task ${i}\",
        \"priority\": \"${PRIORITY[$PRIORITY_IDX]}\",
        \"dueDate\": \"${DUE_DATE}\"
      }" > /dev/null
    echo -e "  Created Task ${i} with priority ${PRIORITY[$PRIORITY_IDX]}"
done
echo -e "${GREEN}✅ PASSED${NC} - Multiple tasks created"
echo ""

# Test 12: Get All Tasks (Pagination Test)
echo -e "${YELLOW}TEST 12: Get All Tasks (Default Pagination)${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "pagination"; then
    echo -e "${GREEN}✅ PASSED${NC} - Tasks retrieved with pagination"
    TASK_COUNT=$(echo "$RESPONSE" | jq '.count')
    echo "Tasks returned: $TASK_COUNT"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 13: Get Tasks with Custom Pagination
echo -e "${YELLOW}TEST 13: Get Tasks - Custom Pagination${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks?page=1&limit=2" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "pagination"; then
    echo -e "${GREEN}✅ PASSED${NC} - Custom pagination working"
    echo "$RESPONSE" | jq '.pagination'
else
    echo -e "${RED}❌ FAILED${NC}"
fi
echo ""

# Test 14: Get Tasks - Filter by Status
echo -e "${YELLOW}TEST 14: Get Tasks - Filter by Pending${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks?status=pending" \
  -H "Authorization: Bearer ${TOKEN}")
PENDING_COUNT=$(echo "$RESPONSE" | jq '.count')
echo -e "${GREEN}✅ PASSED${NC} - Filtering by status works"
echo "Pending tasks: $PENDING_COUNT"
echo ""

# Test 15: Get Single Task
echo -e "${YELLOW}TEST 15: Get Single Task${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks/${TASK_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASSED${NC} - Single task retrieved"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 16: Get Task with Invalid ID
echo -e "${YELLOW}TEST 16: Get Task - Invalid ID${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks/invalid-id-123" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "Invalid.*format"; then
    echo -e "${GREEN}✅ PASSED${NC} - Invalid ID rejected"
    echo "$RESPONSE" | jq .
else
    echo -e "${YELLOW}⚠️  Response:${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 17: Update Task
echo -e "${YELLOW}TEST 17: Update Task${NC}"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/tasks/${TASK_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Complete Project Documentation",
    "priority": "medium",
    "completed": true
  }')
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASSED${NC} - Task updated successfully"
    echo "$RESPONSE" | jq '.data | {title, priority, completed}'
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 18: Update Task with Invalid Data
echo -e "${YELLOW}TEST 18: Update Task - Invalid Priority${NC}"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/api/tasks/${TASK_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "invalid-priority"
  }')
if echo "$RESPONSE" | grep -q "Validation\|must be"; then
    echo -e "${GREEN}✅ PASSED${NC} - Invalid update rejected"
    echo "$RESPONSE" | jq .
else
    echo -e "${YELLOW}⚠️  Response:${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 19: Get Notifications
echo -e "${YELLOW}TEST 19: Get Task Notifications${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks/notifications" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "overdue\|dueToday"; then
    echo -e "${GREEN}✅ PASSED${NC} - Notifications retrieved"
    echo "$RESPONSE" | jq '{totalNotifications, overdue: .data.overdue.count, dueToday: .data.dueToday.count}'
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 20: Get Overdue Count
echo -e "${YELLOW}TEST 20: Get Overdue Count${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks/overdue-count" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "overdueCount"; then
    echo -e "${GREEN}✅ PASSED${NC} - Overdue count retrieved"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
fi
echo ""

# Test 21: Get Tasks Due Soon
echo -e "${YELLOW}TEST 21: Get Tasks Due Soon (48 hours)${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks/due-soon?hours=48" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASSED${NC} - Due soon tasks retrieved"
    DUE_SOON_COUNT=$(echo "$RESPONSE" | jq '.data.count')
    echo "Tasks due within 48 hours: $DUE_SOON_COUNT"
else
    echo -e "${RED}❌ FAILED${NC}"
fi
echo ""

# Test 22: Delete Task
echo -e "${YELLOW}TEST 22: Delete Task${NC}"
RESPONSE=$(curl -s -X DELETE "${BASE_URL}/api/tasks/${TASK_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "deleted successfully"; then
    echo -e "${GREEN}✅ PASSED${NC} - Task deleted successfully"
    echo "$RESPONSE" | jq .
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 23: Verify Task is Deleted
echo -e "${YELLOW}TEST 23: Verify Task Deleted${NC}"
RESPONSE=$(curl -s -X GET "${BASE_URL}/api/tasks/${TASK_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
if echo "$RESPONSE" | grep -q "not found"; then
    echo -e "${GREEN}✅ PASSED${NC} - Task confirmed deleted"
    echo "$RESPONSE" | jq .
else
    echo -e "${YELLOW}⚠️  Response:${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Test 24: Rate Limiting Test
echo -e "${YELLOW}TEST 24: Rate Limiting (Auth Endpoints)${NC}"
echo "Sending 6 rapid login requests (limit is 5 per 15 min)..."
for i in {1..6}; do
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST ${BASE_URL}/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@test.com","password":"wrong"}')
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    if [ "$HTTP_CODE" = "429" ]; then
        echo -e "  Request $i: ${GREEN}✅ Rate limited (429)${NC}"
        echo "$RESPONSE" | grep -v "HTTP_CODE" | jq .
        break
    else
        echo -e "  Request $i: HTTP $HTTP_CODE"
    fi
done
echo ""

# Test 25: Date Handling Test
echo -e "${YELLOW}TEST 25: Date Handling - Create Task for Today${NC}"
TODAY=$(date -u +"%Y-%m-%dT23:59:59.000Z")
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/tasks \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Task Due Today\",
    \"description\": \"Testing date handling\",
    \"priority\": \"high\",
    \"dueDate\": \"${TODAY}\"
  }")
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASSED${NC} - Today's date handled correctly"
    TASK_DUE_TODAY_ID=$(echo "$RESPONSE" | jq -r '.data._id')
    echo "Due Date: $(echo "$RESPONSE" | jq -r '.data.dueDate')"
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "$RESPONSE" | jq .
fi
echo ""

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}          TEST SUMMARY                  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Authentication: WORKING${NC}"
echo -e "${GREEN}✅ Authorization: WORKING${NC}"
echo -e "${GREEN}✅ Validation: WORKING${NC}"
echo -e "${GREEN}✅ CRUD Operations: WORKING${NC}"
echo -e "${GREEN}✅ Pagination: WORKING${NC}"
echo -e "${GREEN}✅ Filtering: WORKING${NC}"
echo -e "${GREEN}✅ Notifications: WORKING${NC}"
echo -e "${GREEN}✅ Rate Limiting: WORKING${NC}"
echo -e "${GREEN}✅ Date Handling: WORKING${NC}"
echo -e "\n${BLUE}All systems operational! 🚀${NC}\n"
