<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<!DOC TYPE html>
<html><head><meta charset="UTF-8"><title>Edit Stop</title>
<style>body{font-family:Arial;margin:20px} label{display:block;margin:8px 0}</style>
</head><body>
<h2>Edit Stop for Route: ${route.name}</h2>
<form method="post">
  <label>ID: ${stop.id}</label>
  <label>Name: <input type="text" name="name" value="${stop.name}" required></label>
  <label>Lat: <input type="text" name="lat" value="${stop.lat}" required></label>
  <label>Lng: <input type="text" name="lng" value="${stop.lng}" required></label>
  <label>Seq: <input type="number" name="seq" value="${stop.seq}" required></label>
  <button type="submit">Save</button>
  <a href="/admin/routes/${route.id}/stops">Cancel</a>
</form>
</body></html>
