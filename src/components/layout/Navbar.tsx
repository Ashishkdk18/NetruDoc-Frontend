import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { Menu as MenuIcon } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../store'
import { logout } from '../../features/auth/authSlice'
import NotificationDropdown from '../../features/notifications/components/NotificationDropdown'

const Navbar: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const menuItems = [
    { text: 'Home', path: '/' },
    { text: 'Doctors', path: '/doctors' },
  ]

  const drawer = (
    <Box sx={{ width: 250 }}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path} onClick={handleMobileMenuToggle}>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAuthenticated && (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/notifications" onClick={handleMobileMenuToggle}>
                <ListItemText primary="Notifications" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} onClick={handleMobileMenuToggle}>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/profile" onClick={handleMobileMenuToggle}>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        {!isAuthenticated && (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/login" onClick={handleMobileMenuToggle}>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/register" onClick={handleMobileMenuToggle}>
                <ListItemText primary="Register" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'white' }}>
            NetruDoc
          </Typography>

          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleMobileMenuToggle}
              >
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={mobileOpen}
                onClose={handleMobileMenuToggle}
              >
                {drawer}
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {menuItems.map((item) => (
                <Button key={item.text} color="inherit" component={Link} to={item.path}>
                  {item.text}
                </Button>
              ))}

              {isAuthenticated ? (
                <>
                  <NotificationDropdown />
                  <Button color="inherit" component={Link} to="/notifications">
                    Notifications
                  </Button>
                  <Button color="inherit" component={Link} to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'}>
                    Dashboard
                  </Button>
                  <Button color="inherit" component={Link} to="/profile">
                    Profile
                  </Button>
                  <Button color="inherit" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button color="inherit" component={Link} to="/login">
                    Login
                  </Button>
                  <Button color="inherit" component={Link} to="/register">
                    Register
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </>
  )
}

export default Navbar
