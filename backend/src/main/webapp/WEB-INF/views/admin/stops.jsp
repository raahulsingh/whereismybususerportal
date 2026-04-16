<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Admin - Stops</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        input[type=text], input[type=number] { width: 160px; padding: 4px; }
        button { padding: 5px 10px; }
        .msg { background: #e7ffe7; border: 1px solid #b6e6b6; padding: 8px; margin: 10px 0; }
    </style>
</head>
<body>

<h2>Stops for Route: <b>${route.name}</b></h2>

<c:if test="${not empty msg}">
    <div class="msg">${msg}</div>
</c:if>

<h3>Add Stop</h3>
<form method="post" action="/admin/routes/${route.id}/stops/save">
    <label>Name: <input type="text" name="name" required></label>
    <label>Lat: <input type="number" step="0.000001" name="lat" required></label>
    <label>Lng: <input type="number" step="0.000001" name="lng" required></label>
    <label>Seq: <input type="number" name="seq" required></label>
    <button type="submit">Add</button>
</form>

<h3>All Stops</h3>
<table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Seq</th>
            <th>Name</th>
            <th>Lat</th>
            <th>Lng</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        <c:forEach var="s" items="${stops}">
            <tr>
                <td>${s.id}</td>
                <td>${s.seq}</td>
                <td>${s.name}</td>
                <td>${s.lat}</td>
                <td>${s.lng}</td>
                <td>
                    <form method="post"
                          action="/admin/routes/${route.id}/stops/${s.id}/delete"
                          onsubmit="return confirm('Delete this stop?');"
                          style="display:inline">
                        <button type="submit">Delete</button>
                    </form>
                </td>
            </tr>
        </c:forEach>
    </tbody>
</table>

<p>
    <a href="/admin/routes">← Back to Routes</a> |
    <a href="/">Map</a>
</p>

</body>
</html>
