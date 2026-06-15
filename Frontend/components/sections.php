 <?php

?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Manage Classes</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Page CSS -->
    <link rel="stylesheet" href="../../css/admin/section.css">

    <!-- Global CSS -->
    <link rel="stylesheet" href="../../css/main.css">
    <link rel="stylesheet" href="../../css/header.css">
    <link rel="stylesheet" href="../../css/sidebar.css">
    <link rel="stylesheet" href="../../css/modal.css">

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>

<body>

    <!-- Header -->
    <?php include 'components/header.php'; ?>

    <!-- Main Container -->
    <div class="container-fluid">
        <div class="row">

            <!-- Sidebar -->
            <div class="col-md-3 col-lg-2 p-0">
                <?php include 'components/sidebar.php'; ?>
            </div>

            <!-- Main Content -->
            <div class="col-md-9 col-lg-10 p-4">

                <!-- Title + Search + Add Button -->
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap">

                    <!-- Left: Title + Search Bar -->
                    <div class="d-flex align-items-center gap-3 flex-wrap">
                        <div>
                            <h2 class="mb-0">
                                <i class="fas fa-chalkboard-teacher text-primary"></i> Manage Classes
                            </h2>
                            <span class="class-count">
                                <?php
                                    $stmt = $conn->query("SELECT COUNT(*) AS count FROM tbl_class");
                                    $count = $stmt->fetch()['count'];
                                    echo "Total Classes: {$count}";
                                ?>
                            </span>
                        </div>

                        <!-- Search Bar -->
                        <div class="search-bar d-flex align-items-center">
                            <div class="search-box d-flex align-items-center">
                                <span class="search-icon"><i class="fas fa-search"></i></span>
                                <input type="text" placeholder="Search classes..." id="classSearch" class="form-control search-input">
                            </div>
                            <button class="btn btn-primary ms-2 search-btn" onclick="performSearch()">Search</button>
                        </div>
                    </div>

                    <!-- Right: Add Class Button -->
                    <button class="btn btn-primary" onclick="window.location.href='add-classes.php'">
                        <i class="fas fa-plus"></i> Add Classes
                    </button>

                </div>

                <!-- Class List -->
                <div id="classList">
                    <!-- Render Class Dynamicaly -->
                </div>
        </div>
    </div>

         <!-- Pagination Section -->
                    <div class="pagination-wrapper">
                        <div>Showing 1 to 1 of 1 entries</div>
                        <nav>
                            <ul class="pagination pagination-sm mb-0">
                                <li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>
                                <li class="page-item active"><a class="page-link" href="#">1</a></li>
                                <li class="page-item disabled"><a class="page-link" href="#">Next</a></li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <!-- Scripts -->
    <script src="../../scripts/admincontent/section.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../../scripts/logout.js"></script>

</body>
</html>
