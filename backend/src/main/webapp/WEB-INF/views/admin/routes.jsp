<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Admin - Routes</title>
  <style>
    body{font-family:Arial;margin:20px}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ddd;padding:8px}
    th{background:#f2f2f2}
    .msg{background:#e7ffe7;border:1px solid #b6e6b6;padding:8px;margin:10px 0}
  </style>
</head>
<body>
<h2>Admin » Routes</h2>

<c:if test="${not empty msg}">
  <div class="msg">${msg}</div>
</c:if>

<h3>Create Route</h3>
<form method="post" action="/admin/routes/save">
  <label>Name: <input type="text" name="name" required></label>
  <button type="submit">Create</button>
</form>

<h3>All Routes</h3>
<table>
  <thead>
    <tr><th>ID</th><th>Name</th><th>Actions</th></tr>
  </thead>
  <tbody>
    <c:forEach var="r" items="${routes}">
      <tr>
        <td>${r.id}</td>
        <td>${r.name}</td>
        <td>
          <a href="/admin/routes/${r.id}/stops">Stops</a>
          <!-- (Optional) implement edit page later -->
          <!-- Delete as POST for safety -->
          <form method="post" action="/admin/routes/${r.id}/delete" style="display:inline"
                onsubmit="return confirm('Delete this route?');">
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
    </c:forEach>
  </tbody>
</table>

<p><a href="/">← Map</a></p>
</body>
</html>
