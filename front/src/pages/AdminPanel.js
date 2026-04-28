import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,

} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TaskIcon from '@mui/icons-material/Assignment';
import UserIcon from '@mui/icons-material/People';
import ReportIcon from '@mui/icons-material/Assessment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import InventoryIcon from '@mui/icons-material/Inventory'; // Для материалов
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'; // Для календаря

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReportsList from '../components/reports/ReportsList';
import UsersEvent from '../components/users/UsersEvent';

// Импортируем логотип из хедера
import logo from "../img/logo.png";
// Импортируем стили из хедера
import '../index.css';
import TasksEvent from '../components/tasks/TasksEvent';
import MaterialsEvent from '../components/materials/MaterialsEvent';
import CalendarView from '../components/CalendarView';

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('tasks');
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);

  // Меню пользователя
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    handleMenuClose();
  };


  const sections = [
    { id: 'tasks', label: 'Задачи', icon: <TaskIcon />, component: <TasksEvent/> },
    { id: 'reports', label: 'Отчеты', icon: <ReportIcon />, component: <ReportsList /> },
    { id: 'materials', label: 'Материалы', icon: <InventoryIcon />, component: <MaterialsEvent /> },
    { id: 'calendar', label: 'Календарь', icon: <CalendarMonthIcon />, component: <CalendarView /> },
    {
      id: 'user', label: 'Пользователи', icon: <UserIcon />, component: (
        <>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss={false}
            draggable
            pauseOnHover
          />
          <UsersEvent />
        </>
      )
    },
  ];

  const drawerWidth = drawerCollapsed ? 70 : 240;

  // Оранжевый цвет из хедера
  const orangeColor = '#ef8810';
  // Темный цвет из хедера
  const darkColor = '#343a40';

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', height: '100vh', overflow: 'hidden' }}>
      <ToastContainer />

      {/* Drawer - темный как в хедере */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: darkColor,
            color: 'white',
            borderRight: 'none',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
          },
        }}
      >
        {/* Логотип как в хедере */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: drawerCollapsed ? 'center' : 'flex-start',
            minHeight: 80,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {!drawerCollapsed ? (
            <>
              <img 
                src={logo} 
                alt="Логотип" 
                style={{ 
                  height: 60, 
                  width: 150,
                  marginRight: 12,
                }} 
              />
            </>
          ) : (
            <img 
              src={logo} 
              alt="Лого" 
              style={{ 
                height: 50,
                width: 50,
                objectFit: 'contain'
              }} 
            />
          )}
          
          <Tooltip title={drawerCollapsed ? "Развернуть меню" : "Свернуть меню"}>
            <IconButton
              onClick={() => setDrawerCollapsed(!drawerCollapsed)}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
               
                display: drawerCollapsed ? 'none' : 'flex'
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

        {/* Информация о пользователе */}
        {!drawerCollapsed && user && (
          <Box sx={{ 
            px: 2, 
            py: 2, 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)'
          }}>
            {user.name} 
        
          </Box>
        )}

        {/* Основное меню */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
          <List sx={{ px: 1 }}>
            {sections.map((section) => (
              <Tooltip
                key={section.id}
                title={drawerCollapsed ? section.label : ""}
                placement="right"
                arrow
              >
                <ListItem
                  button
                  onClick={() => setActiveSection(section.id)}
                  sx={{
                    mb: 1,
                    borderRadius: '4px',
                    justifyContent: drawerCollapsed ? 'center' : 'flex-start',
                    px: drawerCollapsed ? 0 : 2,
                    py: 1.5,
                    backgroundColor: activeSection === section.id ? orangeColor : 'transparent',
                    '&:hover': {
                      backgroundColor: activeSection === section.id ? '#d9760d' : 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: activeSection === section.id ? 'white' : 'white',
                      minWidth: drawerCollapsed ? 'auto' : 40,
                      justifyContent: 'center',
                      mr: drawerCollapsed ? 0 : 2,
                    }}
                  >
                    {section.icon}
                  </ListItemIcon>
                  {!drawerCollapsed && (
                    <ListItemText
                      primary={section.label}
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        noWrap: true,
                        color: activeSection === section.id ? 'white' : 'white'
                      }}
                    />
                  )}
                </ListItem>
              </Tooltip>
            ))}
          </List>

         
        </Box>

        {/* Кнопка выхода с оранжевым цветом */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              borderRadius: '4px',
              justifyContent: drawerCollapsed ? 'center' : 'flex-start',
              px: drawerCollapsed ? 0 : 2,
              py: 1.5,
              backgroundColor: orangeColor,
              '&:hover': {
                backgroundColor: '#d9760d',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: 'white',
                minWidth: drawerCollapsed ? 'auto' : 40,
                justifyContent: 'center',
                mr: drawerCollapsed ? 0 : 2
              }}
            >
              <ExitToAppIcon />
            </ListItemIcon>
            {!drawerCollapsed && (
              <ListItemText
                primary="Выход"
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'white'
                }}
              />
            )}
          </ListItem>
        </Box>
      </Drawer>

      {/* Основной контент */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${drawerWidth}px)`,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          bgcolor: '#f8f9fa',
          overflow: 'hidden'
        }}
      >
        {/* Верхняя панель стилизованная как хедер */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderBottom: '1px solid #dee2e6',
            py: 1.5,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1000,
            flexShrink: 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={() => setDrawerCollapsed(!drawerCollapsed)}
              sx={{
                mr: 2,
                color: darkColor,
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                },
              }}
            >
              {drawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold',
              color: darkColor,
              fontSize: '1.25rem'
            }}>
              {sections.find(s => s.id === activeSection)?.label}
            </Typography>
          </Box>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: 'rgba(239, 136, 16, 0.1)',
                px: 2,
                py: 0.75,
                borderRadius: '4px',
                border: `1px solid ${orangeColor}`
              }}>
                <Typography variant="body2" sx={{ 
                  fontWeight: 500, 
                  color: darkColor
                }}>
                  {user.role_name}
                </Typography>
              </Box>

              <Tooltip title="Меню пользователя">
                <IconButton
                  onClick={handleMenuClick}
                  sx={{
                    p: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.05)'
                    }
                  }}
                >
                
                </IconButton>
              </Tooltip>
              
              
            </Box>
          )}
        </Box>

        {/* Контент - растягивается на весь оставшийся экран */}
        <Box sx={{ 
          flexGrow: 1,
          width: '100%',
          height: 'calc(100% - 65px)', // Вычитаем высоту верхней панели
          overflow: 'auto',
          bgcolor: '#f8f9fa',
          p: 0,
          m: 0
        }}>
          <Box sx={{ 
            height: '100%',
            width: '100%',
            p: 0,
            m: 0
          }}>
            {sections.find(section => section.id === activeSection)?.component}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPanel;