<Routes>
  <Route path="/login" element={<Login />} />

  <Route
    path="/classes"
    element={
      <ProtectedRoute>
        <Classes />
      </ProtectedRoute>
    }
  />

  <Route
    path="/classes/:id"
    element={
      <ProtectedRoute>
        <Classroom />
      </ProtectedRoute>
    }
  />
</Routes>
