
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>

<!DOC TYPE html>
<html><head><meta charset="UTF-8"><title>Edit Route</title>
<style>body{font-family:Arial;margin:20px} label{display:block;margin:8px 0}</style>
</head><body>
<h2>Edit Route</h2>
<form method="post">
  <label>ID: ${route.id}</label>
  <label>Name: <input type="text" name="name" value="${route.name}" required></label>
  <button type="submit">Save</button>
  <a href="/admin/routes">Cancel</a>
</form>
</body></html>
